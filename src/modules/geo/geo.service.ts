import { Injectable } from '@nestjs/common';
import { GeoDataRepository } from './geo-data.repository';
import { TTranslateText } from 'src/types/t-translate-text';
import { TCategory } from 'src/types/t-category';
import { Hotels } from '../hotels/hotels.entity';
import { GeoData } from './geo-data.entity';
import { TGeoData } from './geo-data.types';

@Injectable()
export class GeoService {
    constructor(
        private readonly geoDataRepository: GeoDataRepository,
    ) { }

    async saveGeoData(
        hotelId: string,
        titles: TTranslateText,
        geoDataData: Array<TTranslateText & Partial<TGeoData>>,
        type: TCategory) {

        // Типизируем объект отеля
        const hotel: Hotels = { id: hotelId } as Hotels;

        // Проверяем наличие записи для русского языка
        let geoDataRu = await this.geoDataRepository.findByHotelLanguageAndTitle(
            hotelId,
            'ru',
            titles.original
        );

        // Если такой записи не существует, создаем новую
        if (!geoDataRu) {
            geoDataRu = new GeoData();
            geoDataRu.hotel = hotel;
            geoDataRu.language = 'ru';
            geoDataRu.title = titles.original;
            geoDataRu.type = type;
            geoDataRu.geo_list = geoDataData.map(geoData => ({
                idx: geoData.idx,
                name: geoData.original,
                category: geoData.category,
                distance_from_hotel: geoData.distance_from_hotel,
                measurement: geoData.measurement,
            }));
            await this.geoDataRepository.save(geoDataRu);
        }

        // Проверяем наличие записи для английского языка
        let geoDataEn = await this.geoDataRepository.findByHotelLanguageAndTitle(
            hotelId,
            'en',
            titles.translated
        );

        // Если такой записи не существует, создаем новую
        if (!geoDataEn) {
            geoDataEn = new GeoData();
            geoDataEn.hotel = hotel;
            geoDataEn.language = 'en';
            geoDataEn.title = titles.translated;
            geoDataEn.type = type;
            geoDataEn.geo_list = geoDataData.map(geoData => ({
                idx: geoData.idx,
                name: geoData.translated,
                category: geoData.category,
                distance_from_hotel: geoData.distance_from_hotel,
                measurement: geoData.measurement,
            }));
            await this.geoDataRepository.save(geoDataEn);
        }

        return geoDataEn.language === 'en' && geoDataRu.language === 'ru';
    }
}

