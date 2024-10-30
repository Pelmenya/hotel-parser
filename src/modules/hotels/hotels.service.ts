import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HotelsRepository } from './hotels.repository';
import { FilesService } from '../files/files.service';
import { DistrictsRepository } from '../districts/districts.repository';
import { Districts } from '../districts/districts.entity';
import { ParserService } from '../parser/parser.service';

import * as cheerio from 'cheerio';
import { ImagesService } from '../images/images.service';

function replaceResolutionInUrl(url: string, newResolution: string): string {
    return url.replace(/\/t\/x?\d+x\d+\//, `/t/${newResolution}/`);
}

@Injectable()
export class HotelsService {
    private readonly logger = new Logger(HotelsService.name);
    private readonly instanceId: number;
    private readonly totalInstances: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly hotelsRepository: HotelsRepository,
        private readonly districtsRepository: DistrictsRepository,
        private readonly parserService: ParserService,
        private readonly filesService: FilesService,
        private readonly imagesService: ImagesService,

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
                const success = await this.extractAndStoreHotelsFromDistrictPage(districtData, page);
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

    private async extractAndStoreHotelsFromDistrictPage(district: Districts, page: number): Promise<boolean> {
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

    async saveHotelPage(hotelId: string, hotelLink: string) {
        const linkPaths = hotelLink.split('/');
        linkPaths.splice(0, 3);
        const data = await this.parserService.parsePage(`/${linkPaths.join('/')}`);
        if (data.error) {
            this.logger.error(`Failed to get data for page of hotel ${hotelLink}:`, data.message);
        }
        const { success } = await this.filesService.saveDataToJsonFile(data, `page_${hotelLink.split('/')[5]}.json`, `pages/hotels/${hotelLink.split('/')[5]}`);
        if (success) {
            await this.hotelsRepository.updateHotelPageLoaded(hotelId, true);
        }
        return data;
    }

    async saveHotelsPages() {
        const hotels = await this.hotelsRepository.findAll();

        hotels.sort((a, b) => a.id.localeCompare(b.id));

        const pagesToProcess = Array.from({ length: hotels.length }, (_, i) => i + 1)
            .filter(page =>
                (page - 1) % this.totalInstances === this.instanceId - 1 && hotels[page] &&
                !hotels[page].page_loaded
            );

        if (pagesToProcess.length === 0) {
            this.logger.log(`All page for hotels are already loaded.`);
            return;
        }

        for (const page of pagesToProcess) {
            try {
                await this.saveHotelPage(hotels[page].id, hotels[page].hotel_link_ostrovok)
            } catch (error) {
                this.logger.error(`Error loaded page ${page} of hotel ${hotels[page].hotel_link_ostrovok}:`, error.stack);
            }
        }

        return pagesToProcess.length;
    }

    async getDataHotelFromJson(hotelLink: string) {
        return this.filesService.readDataHotelFromJson(hotelLink);
    }

    async extractAndStoreHotelFromPage(id: string) {
        const hotels = await this.hotelsRepository.findHotelsWithSavePageById(id);
        if (hotels.length) {
            const hotel = hotels[0];
            const data = await this.getDataHotelFromJson(hotel.hotel_link_ostrovok.split('/')[5]);
            const $ = cheerio.load(data);
            hotel.name = $('.HotelHeader_name__hWIU0').text().trim();

            const main_image_url = replaceResolutionInUrl($('.ScrollGallery_slide__My3l7').first().find('img').attr('src'), '1024x768');
            const additional_image_urls: string[] = $('.ScrollGallery_slide__My3l7').map((idx, el) => {
                if (idx !== 0)
                    return replaceResolutionInUrl($(el).find('img').attr('src'), '1024x768');
            }).get();

//            await this.imagesService.processAndSaveImages([main_image_url], 'main', hotel.id)
  //          await this.imagesService.processAndSaveImages(additional_image_urls, 'additional', hotel.id);

            this.logger.log(hotel);

            // Сохранение обновленных данных отеля в базу данных
            //    await this.hotelsRepository.save(hotel);

            return hotel;
        }
    }

    async extractAndStoreAndProcessHotelImagesFromPage(id: string) {
        const hotels = await this.hotelsRepository.findHotelsWithSavePageById(id);
        if (hotels.length) {
            const hotel = hotels[0];
            const data = await this.getDataHotelFromJson(hotel.hotel_link_ostrovok.split('/')[5]);
            const $ = cheerio.load(data);

            const main_image_url = replaceResolutionInUrl($('.ScrollGallery_slide__My3l7').first().find('img').attr('src'), '1024x768');
            const additional_image_urls: string[] = $('.ScrollGallery_slide__My3l7').map((idx, el) => {
                if (idx !== 0)
                    return replaceResolutionInUrl($(el).find('img').attr('src'), '1024x768');
            }).get();

            await this.imagesService.processAndSaveImages([main_image_url], 'main', hotel.id)
            await this.imagesService.processAndSaveImages(additional_image_urls, 'additional', hotel.id);


            return [main_image_url, ...additional_image_urls];
        }
    }

}
