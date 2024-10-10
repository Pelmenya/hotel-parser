import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { CountryRepository } from '../country/country.repository';
import { HotelRepository } from '../hotel/hotel.repository';
import { FileService } from '../file/file.service';

export type TParserLoadContent = 'puppeteer' | 'axios';

@Injectable()
export class ParserService {
    proxyConfig: {
        proxy: {
            protocol: string,
            host: string,
            port: number,
        }
    } = {
            proxy: {
                protocol: '',
                host: '',
                port: 0
            }
        };

    constructor(
        private readonly configService: ConfigService,
        private readonly fileService: FileService,
        private readonly countriesRepository: CountryRepository,
        private readonly hotelRepository: HotelRepository,
    ) {
        this.proxyConfig = {
            proxy: {
                protocol: this.configService.get('PROXY_PROTOCOL'),
                host: this.configService.get('PROXY_HOST'),
                port: Number(this.configService.get('PROXY_PORT')),
            }
        }
        this.checkIP();
    }

    // axios без динамики на странице, puppeteer с динамическим поведением на странице
    async parsePage(params: any, type: TParserLoadContent = 'axios') {
        const url = this.configService.get('BASE_PARSE_URL') + `/${params}`; // Замените на реальный URL
        await this.checkIP();
        try {
            const { data } = type === 'axios' ? await axios.get(url, this.proxyConfig) : { data: await this.loadFullPageWithLocalProxy(url) };
            return data
        } catch (error) {
            console.log(error)
            return error.text;
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

            Promise.all(promises);
        };

        await getHotels();
        return hotels
    }

    async getCountPageOfHotelsInCountry(country: string) {

    }

    async loadFullPageWithLocalProxy(url: string) {
        const browser = await puppeteer.launch({
            args: [
                `--proxy-server=${this.proxyConfig.proxy.protocol}://${this.proxyConfig.proxy.host}:${this.proxyConfig.proxy.port}`, 
                '--no-sandbox', 
                '--disable-setuid-sandbox'
            ],
        });
        const page = await browser.newPage();
        await page.goto('url', { waitUntil: 'load', timeout: 0 });


        // Ваши действия на странице
        const content = await page.content();

        await browser.close();
        return content;
    }

    async checkIP() {
        try {
            const response = await axios.get('http://api.ipify.org', this.proxyConfig);
            console.log('Your IP through proxy is:', response.data);
        } catch (error) {
            console.error('Error checking IP:', error);
        }
    }
}
