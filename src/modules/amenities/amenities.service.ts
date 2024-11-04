import { Injectable } from '@nestjs/common';
import { AmenitiesRepository } from './amenities.repository';
import { TAmenity } from './amenities.types';
import { TCategory } from 'src/types/t-category';
import { TTranslateText } from 'src/types/t-translate-text';
import { Amenities } from './amenities.entity';
import { Hotels } from '../hotels/hotels.entity';

@Injectable()
export class AmenitiesService {
  constructor(
    private readonly amenitiesRepository: AmenitiesRepository,
  ) { }

  async saveAmenities(
    hotelId: string,
    titles: TTranslateText,
    amenitiesData: Array<TTranslateText & { idx: number, paid?: boolean }>,
    type: TCategory) {

    // Типизируем объект отеля
    const hotel: Hotels = { id: hotelId } as Hotels;

    // Проверяем наличие записи для русского языка
    let amenityRu = await this.amenitiesRepository.findByHotelLanguageAndTitle(
      hotelId, 
      'ru', 
      titles.original
    );

    // Если такой записи не существует, создаем новую
    if (!amenityRu) {
      amenityRu = new Amenities();
      amenityRu.hotel = hotel;
      amenityRu.language = 'ru';
      amenityRu.title = titles.original;
      amenityRu.type = type;
      amenityRu.amenities_list = amenitiesData.map(amenity => ({
        idx: amenity.idx,
        name: amenity.original,
        paid: amenity.paid
      }));
      await this.amenitiesRepository.save(amenityRu);
    }

    // Проверяем наличие записи для английского языка
    let amenityEn = await this.amenitiesRepository.findByHotelLanguageAndTitle(
      hotelId, 
      'en', 
      titles.translated
    );

    // Если такой записи не существует, создаем новую
    if (!amenityEn) {
      amenityEn = new Amenities();
      amenityEn.hotel = hotel;
      amenityEn.language = 'en';
      amenityEn.title = titles.translated;
      amenityEn.type = type;
      amenityEn.amenities_list = amenitiesData.map(amenity => ({
        idx: amenity.idx,
        name: amenity.translated,
        paid: amenity.paid
      }));
      await this.amenitiesRepository.save(amenityEn);
    }

    return amenityEn.language === 'en' && amenityRu.language === 'ru';
  }
}
