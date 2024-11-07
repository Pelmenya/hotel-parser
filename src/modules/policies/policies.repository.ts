import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TLanguage } from 'src/types/t-language';
import { TCategory } from 'src/types/t-category';
import { Policies } from './policies.entity';
import { TSettlementConditions } from './policies.types';

@Injectable()
export class PoliciesRepository {
  constructor(
    @InjectRepository(Policies)
    private policiesRepository: Repository<Policies>,
  ) {}

  // Метод для сохранения или обновления записи
  async save(amenity: Policies): Promise<Policies> {
    return this.policiesRepository.save(amenity);
  }

  // Метод для поиска всех по ID отеля
  async findByHotelId(hotelId: string): Promise<Policies[]> {
    return this.policiesRepository.find({ where: { hotel: { id: hotelId } } });
  }

  // Метод для удаления записи по ID
  async deleteById(id: string): Promise<void> {
    await this.policiesRepository.delete(id);
  }

  // Метод для обновления записи
  async update(amenity: Policies): Promise<Policies> {
    return this.policiesRepository.save(amenity);
  }

  // Метод для поиска записи по уникальной комбинации полей: ID отеля, язык и заголовок
  async findByHotelLanguageAndTitle(hotelId: string, language: TLanguage, title: string): Promise<Policies | undefined> {
    return this.policiesRepository.findOne({
      where: {
        hotel: { id: hotelId },
        language: language,
        title: title,
      },
    });
  }



  // Метод для обновления только списка аменитиз в существующей записи
  async updatePolicy(id: string, policy: TSettlementConditions[]): Promise<void> {
    await this.policiesRepository.update(id, { policy });
  }
}
