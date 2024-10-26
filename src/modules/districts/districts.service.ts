import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DistrictsRepository } from './districts.repository';
import { FilesService } from '../files/files.service';
import { ParserService } from '../parser/parser.service'; // Импортируем ParserService
import * as cheerio from 'cheerio';

@Injectable()
export class DistrictsService {
    private readonly logger = new Logger(DistrictsService.name);
    private readonly instanceId: number;
    private readonly totalInstances: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly districtsRepository: DistrictsRepository,
        private readonly filesService: FilesService,
        private readonly parserService: ParserService, // Добавляем зависимость ParserService
    ) {
        this.instanceId = this.configService.get<number>('INSTANCE_ID');
        this.totalInstances = this.configService.get<number>('TOTAL_INSTANCES');
    }

    async createDistrictsFromPages() {
        const totalPages = 774;
        const batchSize = 10;
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
                        this.logger.log(`District already exists: ${name}, ${district_link_ostrovok}`);
                    }
                }).get();

                await Promise.all(pagePromises);
            } catch (error) {
                this.logger.error(`Error processing page ${page}:`, error);
            }
        };

        for (let i = 0; i < totalPages; i += batchSize) {
            const batchPromises = [];
            for (let j = 0; j < batchSize && i + j < totalPages; j++) {
                batchPromises.push(parseAndStoreDistrictsFromPage(i + j + 1));
            }
            await Promise.all(batchPromises);
            this.logger.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalPages / batchSize)}`);
        }

        this.logger.log('All pages processing completed');
        return districts;
    }

    async processAllDistricts() {
        try {
            const districts = await this.districtsRepository.findAll();
            const districtsToProcess = districts.filter(d => d.count_pages > 0 && d.all_pages_loaded);

            for (const district of districtsToProcess) {
                try {
                    await this.createDistrictPages(district.district_link_ostrovok);
                } catch (error) {
                    this.logger.error(`Error processing district ${district.name}:`, error);
                }
            }

            this.logger.log(`Processed ${districtsToProcess.length} districts.`);
        } catch (error) {
            this.logger.error('Error processing all districts:', error);
        }
    }

    async createDistrictPages(districtLink: string) {
        const districtData = await this.districtsRepository.findByLink(districtLink);
    
        if (!districtData || districtData.count_pages <= 0) {
            this.logger.error(`No data for district ${districtLink}`);
            return;
        }
    
        const { count_pages, id, processed_pages = [] } = districtData;
        const processedPagesNumeric = processed_pages.map(Number);
    
        const pagesToProcess = Array.from({ length: count_pages }, (_, i) => i + 1)
            .filter(page => 
                (page - 1) % this.totalInstances === this.instanceId - 1 && 
                !processedPagesNumeric.includes(page)
            );
    
        if (pagesToProcess.length === 0) {
            this.logger.log(`All pages for district ${districtLink} are already processed.`);
            return;
        }

        for (const page of pagesToProcess) {
            try {
                const data = await this.parseDistrictPage(page, districtLink);
                if (data.error) {
                    this.logger.error(`Error processing page ${page} of district ${districtLink}:`, data.message);
                    continue;
                }
    
                // Обновляем массив только после успешной обработки страницы
                const updatedProcessedPages = [...processedPagesNumeric, page];
                await this.districtsRepository.updateProcessedPages(id, updatedProcessedPages);
                processedPagesNumeric.push(page); // Локально обновляем массив для последующих итераций
    
                if (updatedProcessedPages.length === count_pages) {
                    await this.districtsRepository.updateAllPagesLoaded(id, true);
                    this.logger.log(`All pages for district ${districtLink} are processed and loaded.`);
                }
            } catch (error) {
                this.logger.error(`Error processing page ${page} of district ${districtLink}:`, error);
            }
        }
    }
        
    async parseDistrictPage(page: number, districtLink: string) {
        const data = await this.parserService.parsePage(`/${districtLink.split('/')[3]}/?page=${page}`);
        if (data.error) {
            this.logger.error(`Failed to get data for page ${page} of district ${districtLink}:`, data.message);
        }
        await this.filesService.saveDataToJsonFile(data, `page_${page}.json`, `pages/districts/${districtLink.split('/')[3]}`);
        return data;
    }

    async updateDistrictCountPageAndRegion(link: string) {
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

    async updateDistrictsCountPages() {
        try {
            const instanceId = this.instanceId;
            const totalInstances = this.totalInstances;
            const districts = await this.districtsRepository.findAll();

            districts.sort((a, b) => a.id.localeCompare(b.id));

            const districtsToUpdate = districts.filter(d => d.count_pages === null);

            const groupSize = Math.ceil(districtsToUpdate.length / totalInstances);

            const startIndex = (instanceId - 1) * groupSize;
            const endIndex = Math.min(startIndex + groupSize, districtsToUpdate.length);

            const filteredDistricts = districtsToUpdate.slice(startIndex, endIndex);

            for (const district of filteredDistricts) {
                const { name, district_link_ostrovok } = district;
                try {
                    const data = await this.updateDistrictCountPageAndRegion(district_link_ostrovok);
                    const count_pages = parseInt(data.count_pages, 10);
                    const { region, count_hotels } = data;

                    if (!isNaN(count_pages)) {
                        await this.districtsRepository.updateCountPages(district.id, count_pages, region, count_hotels);
                        this.logger.log(`Updated district "${name}" with pages: ${count_pages} and region: ${region} hotels: ${count_hotels}`);
                    } else {
                        this.logger.warn(`Failed to parse count_pages for district "${name}", received: ${count_pages}`);
                    }
                } catch (error) {
                    this.logger.error(`Error updating district "${name}":`, error);
                }
            }
            this.logger.log(`Update of ${filteredDistricts.length} records completed.`);
        } catch (error) {
            this.logger.error('Error updating records:', error);
        }
    }
// методы основных страниц с districts
    async saveMainPage(page: number) {
        const data = await this.parserService.parsePage(`?page=${page}`);
        if (data.error) {
            this.logger.error(`Failed to fetch data for page ${page}:`, data.error);
        }
        await this.filesService.saveDataToJsonFile(data, `page_${page}.json`, 'pages');
        return data;
    }

    async processSaveMainPagesAll(start: number, end: number) {
        for (let i = start; i <= end; i++) {
            try {
                await this.saveMainPage(i);
            } catch (error) {
                this.logger.error('Error save main page', i, ':', error);
            }
    }
        return { success: true };
    }

}
