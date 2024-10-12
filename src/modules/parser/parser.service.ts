import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { CountryRepository } from '../country/country.repository';
import { HotelRepository } from '../hotel/hotel.repository';
import { FileService } from '../file/file.service';
import { SocksProxyAgent } from 'socks-proxy-agent';

export type TParserLoadContent = 'puppeteer' | 'axios';

@Injectable()
export class ParserService {
    private axiosInstance: any;
    private proxyUrl: string;
    constructor(
        private readonly configService: ConfigService,
        private readonly fileService: FileService,
        private readonly countriesRepository: CountryRepository,
        private readonly hotelRepository: HotelRepository,
    ) {
        const proxyHost = this.configService.get('PROXY_HOST');
        const proxyPort = this.configService.get('PROXY_PORT');
        const proxyUsername = this.configService.get('PROXY_LOGIN');
        const proxyPassword = this.configService.get('PROXY_PASSWORD');

        this.proxyUrl = `socks5://${proxyUsername}:${proxyPassword}@${proxyHost}:${proxyPort}`;

        const socksAgent = new SocksProxyAgent(this.proxyUrl);

        this.axiosInstance = axios.create({
            httpAgent: socksAgent,
            httpsAgent: socksAgent,
        });

        this.checkIP();
    }

    async parsePage(params: any = '', type: TParserLoadContent = 'axios') {
        console.log(params)
        const url =
            this.configService.get('BASE_PARSE_URL') + params;

        await this.checkIP();
        try {
            const { data } = type === 'axios'
                ? await this.axiosInstance.get(url)
                : { data: await this.loadFullPageWithLocalProxy(url) };
            return data;
        } catch (error) {
            console.error('Error fetching page data:', error);
            return error;
        }
    };

    async parseCountries() {
        try {
            const data = await this.parsePage({ slug: 'strany-i-goroda' });
            const $ = cheerio.load(data);

            const getCountry = async () => {
                const promises = [];
                $('.uk-flex').each((index, element) => {
                    const countryName = $(element).find('b').text().trim();
                    const promise = this.countriesRepository.create({
                        name: countryName,
                    });
                    promises.push(promise);
                });
                return Promise.all(promises);
            };

            await getCountry();
            const countries = await this.countriesRepository.findAll();
            return countries;
        } catch (error) {
            console.error('Error parsing countries:', error);
            return error;
        }
    }

    async parseHotelsByPage(page: number) {
        const data = await this.parsePage(`?page=${page}`);
        const $ = cheerio.load(data);
        const hotels: any[] = [];

        const getHotels = async () => {
            const promises = [];
            $('.hotel-wrapper').each((index, element) => {
                const hotelLink = $(element).find('.zenmobilegallery-photo-container').attr('href');
                const name = $(element).find('.zen-hotelcard-name-link').text().trim();
                const address = $(element).find('.zen-hotelcard-address').text().trim();
                const locationValue = $(element).find('.zen-hotelcard-location-value').text().trim();
                const locationFrom = $(element).find('.zen-hotelcard-distance').text().trim().split('\n')[1].trim();
                const locationName = $(element).find('.zen-hotelcard-location-name').text().trim();
                const prevImageUrls = $(element).find('.zenimage-content').attr('src');
                hotels.push({ name, address, locationValue, locationFrom, locationName, hotelLink, prevImageUrls: [prevImageUrls] });
                promises.push(this.fileService.downloadImage(prevImageUrls), prevImageUrls.split('/').pop());
            });

            await Promise.all(promises);
        };

        await getHotels();
        return data;
    }

    async getCountPageOfHotelsInCountry(country: string) {
        // Реализуйте метод, если необходимо
    }

    async loadFullPageWithLocalProxy(url: string) {
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                `--proxy-server=${this.proxyUrl}`
            ],
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'load', timeout: 0 });

        const content = await page.content();

        await browser.close();
        return content;
    }

    async checkIP() {
        try {
            const response = await this.axiosInstance.get('https://api.ipify.org');
            console.log('Your IP through proxy is:', response.data);
        } catch (error) {
            console.error('Error checking IP:', error);
        }
    }
}

