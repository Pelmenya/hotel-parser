import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HotelsRepository } from './hotels.repository';
import { FilesService } from '../files/files.service';
import { DistrictsRepository } from '../districts/districts.repository';
import { Districts } from '../districts/districts.entity';
import * as cheerio from 'cheerio';

@Injectable()
export class HotelsService {
    private readonly logger = new Logger(HotelsService.name);
    private readonly instanceId: number;
    private readonly totalInstances: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly hotelsRepository: HotelsRepository,
        private readonly districtsRepository: DistrictsRepository,
        private readonly filesService: FilesService,
    ) {
        this.instanceId = this.configService.get<number>('INSTANCE_ID');
        this.totalInstances = this.configService.get<number>('TOTAL_INSTANCES');
    }

    async processAllHotels() {
        try {
            const districts = await this.districtsRepository.findAll();

            const districtsToProcess = districts.filter(d => d.count_pages > 0 && d.all_pages_loaded);

            for (const district of districtsToProcess) {
                try {
                    await this.createHotelsFromDistrictPages(district.district_link_ostrovok);
                } catch (error) {
                    this.logger.error(`Error processing hotels for district ${district.name}:`, error.stack);
                }
            }

            this.logger.log(`Processed hotels for ${districtsToProcess.length} districts.`);
        } catch (error) {
            this.logger.error('Error processing all hotels:', error.stack);
        }
    }

    async createHotelsFromDistrictPages(districtLink: string) {
        const districtData = await this.districtsRepository.findByLink(districtLink);
        if (!districtData) {
            this.logger.error(`No district found for ${districtLink}`);
            return;
        }

        const { count_pages: totalPages, processed_hotels_from_pages = [] } = districtData;
        const processedPagesNumeric = processed_hotels_from_pages.map(Number);

        const pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => !processedPagesNumeric.includes(page)
            );

        if (pagesToProcess.length === 0) {
            this.logger.log(`All pages for district ${districtLink} are already processed.`);
            return;
        }

        for (const page of pagesToProcess) {
            try {
                const success = await this.extractAndStoreHotelsFromPage(districtData, page);
                if (success) {
                    // Обновляем массив только после успешной обработки страницы
                    const updatedProcessedPages = [...processedPagesNumeric, page];
                    await this.districtsRepository.updateProcessedHotelsFromPages(districtData.id, updatedProcessedPages);
                    processedPagesNumeric.push(page); // Локально обновляем массив для последующих итераций
                }
            } catch (error) {
                this.logger.error(`Error processing page ${page} of district ${districtLink}:`, error.stack);
            }
        }
    }

    private async extractAndStoreHotelsFromPage(district: Districts, page: number): Promise<boolean> {
        try {
            const data = await this.filesService.readDataPageRussianHotelsFromJson(district.district_link_ostrovok.split('/')[3], page);
            const $ = cheerio.load(data);

            const pagePromises = $('.HotelCard_mainInfo__pNKYU').map(async (index, element) => {
                const hotel_link_ostrovok = $(element).find('.HotelCard_title__cpfvk').children('a').attr('href') || '';
                const name = $(element).find('.HotelCard_title__cpfvk').attr('title').trim() || '';
                const address = $(element).find('.HotelCard_address__AvnV2').text()?.trim() || '';
                const locations_from = [];
                $(element).children('.HotelCard_distances__pVfDQ').map((i, el) => {
                    const distance_from = $(el).text();
                    locations_from.push(distance_from);
                });
                const stars = $(element).find('.Stars_stars__OMmzT').children('.Stars_star__jwPss').length || 0;

                const hotelData = {
                    name,
                    address,
                    hotel_link_ostrovok,
                    locations_from,
                    stars,
                    district, // Добавляем район к данным отеля
                };

                const createdHotel = await this.hotelsRepository.createIfNotExists(hotelData);
                if (createdHotel) {
                    this.logger.log(`Hotel created: ${createdHotel.name}, ${createdHotel.address}`);
                } else {
                    this.logger.log(`Hotel already exists: ${name}, ${address}`);
                }
            }).get();

            await Promise.all(pagePromises);
            return true; // Успешная обработка страницы
        } catch (error) {
            this.logger.error(`Error processing page ${page}:`, error.stack);
            return false; // Неуспешная обработка страницы
        }
    }

    async getRussianHotelsByPageAndDistrict(district: string, page: number) {
        return await this.filesService.readDataPageRussianHotelsFromJson(district, page);
    }
}
