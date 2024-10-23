import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParserService } from '../parser/parser.service';
import { HotelsRepository } from './hotels.repository';
import { FilesService } from '../files/files.service';

import * as cheerio from 'cheerio';


@Injectable()
export class HotelsService {
    constructor(
        private readonly configService: ConfigService,
        private readonly parserService: ParserService,
        private readonly hotelsRepository: HotelsRepository,
        private readonly filesService: FilesService,
    ) {}
    
    async createHotelsFromPages() {
        const totalPages = 391; // Кол-во страниц с отелями на main страницы Гостиницы России
        const batchSize = 10; // Количество страниц для обработки за раз
        const hotels: any[] = [];

        const extractAndStoreHotelsFromPage = async (page: number) => {
            try {
                const data = await this.filesService.readDataPageRussianHotelsFromJson('', page);
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
                batchPromises.push(extractAndStoreHotelsFromPage(i + j + 1));
            }
            await Promise.all(batchPromises);
            console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalPages / batchSize)}`);
        }

        console.log('Обработка всех страниц завершена');
        return hotels;
    }

    async getRussianHotelsByPageAndDistrict(district: string, page: number) {
        return await this.filesService.readDataPageRussianHotelsFromJson(district, page);
    }

    async parseHotelsByPage(page: number, district: string = '') {
        const data = await this.parserService.parsePage(`?page=${page}`);
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
    
}
