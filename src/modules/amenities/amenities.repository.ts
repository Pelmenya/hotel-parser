import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenities } from './amenities.entity';

@Injectable()
export class AmenitiesRepository {
  constructor(
    @InjectRepository(Amenities)
    private amenitiesRepository: Repository<Amenities>,
  ) {}

  async save(about: Amenities): Promise<Amenities> {
    return this.amenitiesRepository.save(about);
  }

  async findByHotelId(hotelId: string): Promise<Amenities[]> {
    return this.amenitiesRepository.find({ where: { hotel: { id: hotelId } } });
  }

  async deleteById(id: string): Promise<void> {
    await this.amenitiesRepository.delete(id);
  }
  
  async update(about: Amenities): Promise<Amenities> {
    return this.amenitiesRepository.save(about);
  }
  
  // Другие методы для работы с изображениями
}