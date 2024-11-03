import { Injectable } from '@nestjs/common';
import { AmenitiesRepository } from './amenities.repository';
import { TAmenity } from './amenities.types';

@Injectable()
export class AmenitiesService {
  constructor(
    private readonly amenitiesRepository: AmenitiesRepository,
  ) {}

  async saveAmenities(hotelId: string, amenitiesData: Array<{ original_text: string, translated_text: string }>) {
    const existingAmenities = await this.amenitiesRepository.findByHotelId(hotelId);

    // Подготовка данных для сохранения
    const amenitiesToSave = amenitiesData.map(data => {
      const amenity: TAmenity = {
        idx: 0, // предположительно, индекс может быть полезен для сортировки или других целей
        name: data.translated_text,
        paid: false, // по умолчанию, может быть обновлено в зависимости от требований
      };

      return {
        hotel: { id: hotelId },
        title: data.original_text, // или другая логика для заголовка
        amenities_list: [amenity],
        language: 'en', // целевой язык
        type: 'main', // или 'additional', в зависимости от логики
      };
    });

    // Сохранение или обновление данных
    for (const amenity of amenitiesToSave) {
      const existingAmenity = existingAmenities.find(a => a.title === amenity.title && a.language === amenity.language);
      if (existingAmenity) {
        // Обновление существующей записи
        existingAmenity.amenities_list = amenity.amenities_list;
        await this.amenitiesRepository.update(existingAmenity);
      } else {
        // Сохранение новой записи
    //    await this.amenitiesRepository.save(amenity);
      }
    }
  }
}
