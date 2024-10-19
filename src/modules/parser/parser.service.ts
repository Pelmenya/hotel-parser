import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { FilesService } from '../files/files.service';
import { CountriesRepository } from '../countries/countries.repository';
import { HotelsRepository } from '../hotels/hotels.repository';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { DistrictsRepository } from '../districts/districts.repository';

export type TParserLoadContent = 'puppeteer' | 'axios';

@Injectable()
export class ParserService {
    private axiosInstance: any;
    private proxyUrl: string;
    private instanceId: 1;
    private totalInstances: 1;
    constructor(
        private readonly configService: ConfigService,
        private readonly filesService: FilesService,
        private readonly countriesRepository: CountriesRepository,
        private readonly hotelsRepository: HotelsRepository,
        private readonly districtsRepository: DistrictsRepository,
    ) {
        const proxyHost = this.configService.get('PROXY_HOST');
        const proxyPort = this.configService.get('PROXY_PORT');
        const proxyUsername = this.configService.get('PROXY_LOGIN');
        const proxyPassword = this.configService.get('PROXY_PASSWORD');
        this.instanceId = this.configService.get('INSTANCE_ID');
        this.instanceId = this.configService.get('INSTANCE_ID');
        this.totalInstances = this.configService.get('TOTAL_INSTANCES');
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

    async parseHotelsByPage(page: number, district: string = '') {
        const data = await this.parsePage(`?page=${page}`);
        if (data.error) {
            console.error(`Failed to fetch data for page ${page}:`, data.message);
        }
        await this.filesService.saveDataToJsonFile(data, `page_${page}.json`, 'pages');
        return data;
    }

    async processAllDistricts() {
        try {
            const instanceId = this.instanceId;
            const totalInstances = this.totalInstances;
            const districts = await this.districtsRepository.findAll();

            // Фильтруем районы, у которых есть страницы для загрузки и которые еще не были загружены
            const districtsToProcess = districts.filter(d => d.count_pages > 0 && !d.pages_loaded);

            // Обрабатываем каждый район
            for (const district of districtsToProcess) {
                try {
                    await this.parseDistrictPages(district.district_link_ostrovok);
                } catch (error) {
                    console.error(`Error processing district ${district.name}:`, error);
                }
                await this.delay(500); // Задержка между обработкой районов
            }

            console.log(`Processed ${districtsToProcess.length} districts.`);
        } catch (error) {
            console.error('Ошибка при обработке всех районов:', error);
        }
    }

    async parseDistrictPages(districtLink: string) {
        const districtData = await this.districtsRepository.findByLink(districtLink);
        if (!districtData || districtData.count_pages === null || districtData.count_pages === 0) {
            console.error(`District data not found or count_pages is null or 0 pages for district ${districtLink}`);
            return `District data not found or count_pages is null or 0 pages for district ${districtLink}`;
        }

        const { count_pages, id } = districtData;
        const instanceId = this.instanceId;
        const totalInstances = this.totalInstances;

        // Распределение страниц по инстансам
        const groupSize = Math.ceil(count_pages / totalInstances); // Определяем размер группы страниц
        const startPage = (instanceId - 1) * groupSize + 1;
        const endPage = Math.min(startPage + groupSize - 1, count_pages);

        for (let page = startPage; page <= endPage; page++) {
            const data = await this.parseDistrictPage(page, districtLink);
            if (data.error) {
                console.error(`Failed to fetch data for district ${districtLink} page ${page}:`, data.message);
                return; // Exit on error to prevent marking as loaded
            }
        }

        // Обновляем поле pages_loaded только если текущий инстанс обработал все свои страницы
        // и другие инстансы могли обработать свои страницы
        await this.districtsRepository.updatePagesLoaded(id, true);
        console.log(`All pages loaded for district: ${districtLink} by instance ${instanceId}`);
    }

    async parseDistrictPage(page: number, districtLink: string) {
        const data = await this.parsePage(`/${districtLink.split('/')[3]}/?page=${page}`);
        if (data.error) {
            console.error(`Failed to fetch data for page ${page} of district ${districtLink}:`, data.message);
        }
        await this.filesService.saveDataToJsonFile(data, `page_${page}.json`, `pages/districts/${districtLink.split('/')[3]}`);
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

    async readDataPageRussianHotelsFromJson(district: string = '', page: number) {
        return this.filesService.readDataFromJsonFile(`page_${page}.json`, `pages${district ? '/districts/' + district : ''}`);
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

    async getDistrictsFromPages() {
        const totalPages = 774;
        const batchSize = 10; // Количество страниц для обработки за раз
        const districts: any[] = [];

        const parseAndStoreDistrictsFromPage = async (page: number) => {
            try {
                const data = await this.readDataPageRussianHotelsFromJson('', page);
                const $ = cheerio.load(data);

                const pagePromises = $('.item__title').map(async (index, element) => {
                    const district_link_ostrovok = $(element).attr('href') || '';
                    const name = $(element).text()?.trim() || '';

                    const districtData = {
                        name,
                        district_link_ostrovok
                    };

                    const existingDistrict = await this.districtsRepository.findByNameAndLink(name, district_link_ostrovok);

                    if (!existingDistrict) {
                        await this.districtsRepository.create(districtData);
                        districts.push(districtData);
                    } else {
                        console.log(`District already exists: ${name}, ${district_link_ostrovok}`);
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
                batchPromises.push(parseAndStoreDistrictsFromPage(i + j + 1));
            }
            await Promise.all(batchPromises);
            console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalPages / batchSize)}`);
        }

        console.log('Обработка всех страниц завершена');
        return districts;
    }

    async updateDistrictCountPageAndRegion(name: string, link: string) {
        const data = await this.parsePage('/' + link.split('/')[3]);
        const $ = cheerio.load(data);

        let resCountPage = null;

        const count = Number($($('.Pagination_item__lBv39').last()).text().trim());
        const countTwo = Number($($('.zen-pagination-item-value').last()).text().trim());

        if (count > 0) {
            resCountPage = count;
        } else if (countTwo > 0) {
            resCountPage = countTwo;
        }

        const headOne = $('.SearchInfo_region__D0BK1');
        const headTwo = $('.zen-regioninfo-region');

        const countHotels = $('.heading-summary-hotels').text().trim();
        const countHotelsTwo = $('.ResultBanner_header__GiOTH').text().trim();

        const extractNumber = (text: string) => {
            const match = text.match(/\d+/);
            return match ? parseInt(match[0], 10) : null;
        };

        const countHotelsNumber = extractNumber(countHotels) || extractNumber(countHotelsTwo) || 0;

        // Устанавливаем количество страниц в 1, если есть гостиницы и количество страниц не определено
        if (countHotelsNumber > 0 && resCountPage === null) {
            resCountPage = '1';
        } else if (!resCountPage) {
            resCountPage = '0';
        }

        return {
            count_pages: resCountPage,
            region: headOne.text().trim() || headTwo.text().trim() || null,
            count_hotels: countHotelsNumber
        };
    }

    async updateDistrictCounts() {
        try {
            const instanceId = this.instanceId; // Получаем идентификатор инстанса
            const totalInstances = this.totalInstances; // Получаем общее количество инстансов
            const districts = await this.districtsRepository.findAll();

            // Сортируем районы по ID (UUID) в лексикографическом порядке
            districts.sort((a, b) => a.id.localeCompare(b.id));

            const districtsToUpdate = districts.filter(d => d.count_pages === null);

            // Определяем размер группы
            const groupSize = Math.ceil(districtsToUpdate.length / totalInstances);

            // Вычисляем начальный и конечный индекс для текущего инстанса
            const startIndex = (instanceId - 1) * groupSize;
            const endIndex = Math.min(startIndex + groupSize, districtsToUpdate.length);

            // Выбираем задачи для текущего инстанса
            const filteredDistricts = districtsToUpdate.slice(startIndex, endIndex);

            for (const district of filteredDistricts) {
                const { name, district_link_ostrovok } = district;
                try {
                    const data = await this.updateDistrictCountPageAndRegion(name, district_link_ostrovok);
                    const count_pages = parseInt(data.count_pages, 10);
                    const { region, count_hotels } = data;

                    if (!isNaN(count_pages)) {
                        await this.districtsRepository.updateCountPages(district.id, count_pages, region, count_hotels);
                        console.log(`Updated district "${name}" with pages: ${count_pages} and region: ${region} hotels: ${count_hotels}`);
                    } else {
                        console.warn(`Failed to parse count_pages for district "${name}", received: ${count_pages}`);
                    }
                } catch (error) {
                    console.error(`Error updating district "${name}":`, error);
                }

                await this.delay(0); // Задержка в 0 секунд между обработкой записей
            }

            console.log(`Обновление ${filteredDistricts.length} записей завершено`);
        } catch (error) {
            console.error('Ошибка при обновлении записей:', error);
        }
    }

    async getHotelsFromPages() {
        const totalPages = 391;
        const batchSize = 10; // Количество страниц для обработки за раз
        const hotels: any[] = [];

        const parseAndStoreHotelsFromPage = async (page: number) => {
            try {
                const data = await this.readDataPageRussianHotelsFromJson('',page);
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
