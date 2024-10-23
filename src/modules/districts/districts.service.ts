import { Injectable } from '@nestjs/common';
import { DistrictsRepository } from './districts.repository';
import { FilesService } from '../files/files.service';

import * as cheerio from 'cheerio';
import { ParserService } from '../parser/parser.service';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class DistrictsService {
    private instanceId: 1;
    private totalInstances: 1;

    constructor(
        private readonly configService: ConfigService,
        private readonly districtsRepository: DistrictsRepository,
        private readonly parserService: ParserService,
        private readonly filesService: FilesService,
    ) {
        this.instanceId = this.configService.get('INSTANCE_ID');
        this.totalInstances = this.configService.get('TOTAL_INSTANCES');

    }

    async createDistrictsFromPages() {
        const totalPages = 774;
        const batchSize = 10; // Количество страниц для обработки за раз
        const districts: any[] = [];

        const parseAndStoreDistrictsFromPage = async (page: number) => {
            try {
                const data = await this.filesService.readDataPageRussianHotelsFromJson('', page);
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
                    await this.createDistrictPages(district.district_link_ostrovok);
                } catch (error) {
                    console.error(`Error processing district ${district.name}:`, error);
                }
                //                await this.delay(0); // Задержка между обработкой районов
            }

            console.log(`Processed ${districtsToProcess.length} districts.`);
        } catch (error) {
            console.error('Ошибка при обработке всех районов:', error);
        }
    }

    async createDistrictPages(districtLink: string) {
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
        const data = await this.parserService.parsePage(`/${districtLink.split('/')[3]}/?page=${page}`);
        if (data.error) {
            console.error(`Failed to fetch data for page ${page} of district ${districtLink}:`, data.message);
        }
        await this.filesService.saveDataToJsonFile(data, `page_${page}.json`, `pages/districts/${districtLink.split('/')[3]}`);
        return data;
    }

    async updateDistrictCountPageAndRegion(name: string, link: string) {
        const data = await this.parserService.parsePage('/' + link.split('/')[3]);
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
                //              await this.delay(0); // Задержка между обработкой районов
            }

            console.log(`Обновление ${filteredDistricts.length} записей завершено`);
        } catch (error) {
            console.error('Ошибка при обновлении записей:', error);
        }
    }

}
