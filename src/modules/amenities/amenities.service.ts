import { Injectable } from '@nestjs/common';
import { AmenitiesRepository } from './amenities.repository';
import { TAmenity } from './amenities.types';
import { TCategory } from 'src/types/t-category';
import { TTranslateText } from 'src/types/t-translate-text';
import { Amenities } from './amenities.entity';

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

    const amenityRu = new Amenities();
    amenityRu.hotel = { id: hotelId } as any;
    amenityRu.language = 'ru';
    amenityRu.title = titles.original;
    amenityRu.type = type;
    amenityRu.amenities_list = amenitiesData.map(amenity => {
      return {
        idx: amenity.idx,
        name: amenity.original,
        paid: amenity.paid
      }
    }
    );
    const saveAmenityRu = await this.amenitiesRepository.save(amenityRu);

    const amenityEn = new Amenities();
    amenityEn.hotel = { id: hotelId } as any;
    amenityEn.language = 'en';
    amenityEn.title = titles.translated;
    amenityEn.type = type;
    amenityEn.amenities_list = amenitiesData.map(amenity => {
      return {
        idx: amenity.idx,
        name: amenity.translated,
        paid: amenity.paid
      }
    }
    );

    const saveAmenityEn = await this.amenitiesRepository.save(amenityEn);

    if (saveAmenityEn.language === 'en' && saveAmenityRu.language === 'ru') {
      return true;
    } else {
      return false;
    }
  };
}
