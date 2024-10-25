import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParserService } from '../parser/parser.service';
import { HotelsRepository } from './hotels.repository';
import { FilesService } from '../files/files.service';
import { DistrictsRepository } from '../districts/districts.repository';
import { Districts } from '../districts/districts.entity';
import { Hotels } from './hotels.entity';


import * as cheerio from 'cheerio';


@Injectable()
export class HotelsService {
    constructor(
        private readonly hotelsRepository: HotelsRepository,
        private readonly districtsRepository: DistrictsRepository,
        private readonly filesService: FilesService,
    ) { }

    async createHotelsFromDistrictsPages(district: string) {
        const districtData = await this.districtsRepository.findByLink('/hotel/russia/' + district + '/');
        if (!districtData) {
            console.error(`No district found for ${district}`);
            return [];
        }

        const { count_pages: totalPages } = districtData;
        const batchSize = 10;
        const hotels: Partial<Hotels>[] = [];

        for (let i = 0; i < totalPages; i += batchSize) {
            console.log(`Processing batch starting at page ${i + 1}`);
            const batchPromises = [];
            for (let j = 0; j < batchSize && i + j < totalPages; j++) {
                batchPromises.push(this.extractAndStoreHotelsFromPage(districtData, i + j + 1, hotels));
            }
            await Promise.all(batchPromises);
            console.log(`Processed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalPages / batchSize)}`);
        }

        console.log('All district pages processed');
        return hotels;
    }

    private async extractAndStoreHotelsFromPage(district: Districts, page: number, hotels: Partial<Hotels>[]) {
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

                // Добавляем данные отеля в массив
                hotels.push(hotelData);

                // Используем метод createIfNotExists для безопасной вставки
                const createdHotel = await this.hotelsRepository.createIfNotExists(hotelData);
                if (createdHotel) {
                    console.log(`Hotel created: ${createdHotel.name}, ${createdHotel.address}`);
                } else {
                    console.log(`Hotel already exists: ${name}, ${address}`);
                }
            }).get();

            await Promise.all(pagePromises);
        } catch (error) {
            console.error(`Error processing page ${page}:`, error);
        }
    }

    async getRussianHotelsByPageAndDistrict(district: string, page: number) {
        return await this.filesService.readDataPageRussianHotelsFromJson(district, page);
    }
}
