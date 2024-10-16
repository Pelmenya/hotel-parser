import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { FilesService } from '../files/files.service';
import { CountriesRepository } from '../countries/countries.repository';
import { HotelsRepository } from '../hotels/hotels.repository';
import { SocksProxyAgent } from 'socks-proxy-agent';

export type TParserLoadContent = 'puppeteer' | 'axios';

@Injectable()
export class ParserService {
    private axiosInstance: any;
    private proxyUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly filesService: FilesService,
        private readonly countriesRepository: CountriesRepository,
        private readonly hotelsRepository: HotelsRepository,
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

    private extractBase64Svgs(cssContent: string): string[] {
        const base64Matches = cssContent.match(/url$$\s*['"]?data:image\/svg\+xml;base64,([^)]+)['"]?\s*$$/g);
        if (!base64Matches) return [];

        return base64Matches.map(match => {
            const base64String = match.split(',')[1].slice(0, -1); // remove trailing parenthesis
            return Buffer.from(base64String, 'base64').toString('utf8');
        });
    }

    async parsePage(params: any = '', type: TParserLoadContent = 'axios', retries: number = 3) {
        console.log(params);
        const url = this.configService.get('BASE_PARSE_URL') + params;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const { data } = type === 'axios'
                    ? await this.axiosInstance.get(url)
                    : { data: await this.loadFullPageWithLocalProxy(url) };
                return data;
            } catch (error) {
                console.error(`Attempt ${attempt} - Error fetching page data:`, error.message);
                if (attempt === retries) {
                    return { error: `Failed after ${retries} attempts`, message: error.message };
                }
                await this.delay(2000); // задержка между попытками
            }
        }
    }

    async parseHotelsByPage(page: number) {
        const data = await this.parsePage(`?page=${page}`);
        if (data.error) {
            console.error(`Failed to fetch data for page ${page}:`, data.message);
        }
        await this.filesService.saveDataToJsonFile(data, `page_${page}.json`, 'pages');
        return data;
    }

    async parseRussianHotels(start: number, end: number) {
        const promises = [];
        for (let i = start; i <= end; i++) {
            promises.push(this.delayedParseHotelsByPage(i, (i - start + 1) * 4000));
        }
        await Promise.all(promises);
        return { success: true };
    }

    delayedParseHotelsByPage(page: number, delay: number) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const data = await this.parseHotelsByPage(page);
                    resolve(data);
                } catch (error) {
                    console.error('Ошибка при парсинге отелей на странице', page, ':', error);
                    reject(error);
                }
            }, delay);
        });
    }

    async readDataPageRussianHotelsFromJson(page: number) {
        return this.filesService.readDataFromJsonFile(`page_${page}.json`, 'pages');
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

    async getHotelsFromPages() {
        const totalPages = 391;
        const batchSize = 10; // Количество страниц для обработки за раз
        const hotels: any[] = [];

        const parseAndStoreHotelsFromPage = async (page: number) => {
            try {
                const data = await this.readDataPageRussianHotelsFromJson(page);
                const $ = cheerio.load(data);

                const pagePromises = $('.hotel-wrapper').map(async (index, element) => {
                    const hotel_link_ostrovok = $(element).find('.zenmobilegallery-photo-container').attr('href') || '';
                    const name = $(element).find('.zen-hotelcard-name-link').text()?.trim() || '';
                    const address = $(element).find('.zen-hotelcard-address').text()?.trim() || '';
                    const location_value = $(element).find('.zen-hotelcard-location-value').text()?.trim() || '';
                    const location_from = $(element).find('.zen-hotelcard-distance').text()?.trim().split('\n')[1]?.trim() || '';
                    const location_name = $(element).find('.zen-hotelcard-location-name').text()?.trim() || '';
                    const prev_image_urls = $(element).find('.zenimage-content').attr('src') || '';
                    const stars = $(element).find('.zen-ui-stars').children('.zen-ui-stars-wrapper').length;

                    const hotelData = {
                        name,
                        address,
                        location_value,
                        location_from,
                        location_name,
                        hotel_link_ostrovok,
                        prev_image_urls: [prev_image_urls],
                        stars,
                    };

                    const existingHotel = await this.hotelsRepository.findByNameAndAddress(name, address);

                    if (!existingHotel) {
                        await this.hotelsRepository.create(hotelData);
                        hotels.push(hotelData);
                    } else {
                        console.log(`Hotel already exists: ${name}, ${address}`);
                    }
                }).get();

                await Promise.all(pagePromises);
            } catch (error) {
                console.error(`Ошибка при обработке страницы ${page}:`, error);
            }
        };

        for (let i = 0; i < totalPages; i += batchSize) {
            const batchPromises = [];
            for (let j = 0; j < batchSize && i + j < totalPages; j++) {
                batchPromises.push(parseAndStoreHotelsFromPage(i + j + 1));
            }
            await Promise.all(batchPromises);
            console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalPages / batchSize)}`);
        }

        console.log('Обработка всех страниц завершена');
        return hotels;
    }

    async extractSvgIconsFromCss(page: number): Promise<any> {
        try {
            const data = await this.filesService.readDataFromJsonFile(`page_${page}.json`, 'pages');
            const $ = cheerio.load(data);
            const styleTags = $('style');

            styleTags.each((index, element) => {
                const cssContent = $(element).html();
                const svgIcons = this.extractBase64Svgs(cssContent);

                svgIcons.forEach((svg, idx) => {
                    const filePath = `icon_${index}_${idx}.svg`;
                    this.filesService.saveDataToFile(svg, filePath, 'icons');
                    console.log(`SVG icon saved to ${filePath}`);
                });
            });
            return Promise.resolve({ success: true });
        } catch (error) {
            console.error('Error extracting SVG icons:', error);
        }
    }

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

    async checkIP() {
        try {
            const response = await this.axiosInstance.get('https://api.ipify.org');
            console.log('Your IP through proxy is:', response.data);
        } catch (error) {
            console.error('Error checking IP:', error);
        }
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
