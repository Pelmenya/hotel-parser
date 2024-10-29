import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hotels } from './hotels.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HotelsRepository {
    constructor(
        @InjectRepository(Hotels)
        private hotelsRepository: Repository<Hotels>,
    ) { }

    async findAll(): Promise<Hotels[]> {
        return await this.hotelsRepository.find();
    }

    async findOne(id: string): Promise<Hotels> {
        return await this.hotelsRepository.findOneBy({ id });
    }

    async remove(id: string): Promise<void> {
        await this.hotelsRepository.delete(id);
    }

    // Метод для безопасного создания записи с учетом уникальности
    async createIfNotExists(hotel: Partial<Hotels>): Promise<Hotels | null> {
        const existingHotel = await this.hotelsRepository.findOne({
            where: { hotel_link_ostrovok: hotel.hotel_link_ostrovok },
        });

        if (existingHotel) {
            console.log(`Hotel already exists: ${hotel.name}, ${hotel.address}`);
            return null; // Возвращаем null, если отель уже существует
        }

        // Вставляем отель с использованием ON CONFLICT DO NOTHING
        const query = `
            INSERT INTO hotels (name, address, hotel_link_ostrovok, locations_from, stars, district_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (hotel_link_ostrovok) DO NOTHING
            RETURNING *;
        `;
        const result = await this.hotelsRepository.query(query, [
            hotel.name,
            hotel.address,
            hotel.hotel_link_ostrovok,
            hotel.locations_from,
            hotel.stars,
            hotel.district.id, // Указываем id района
        ]);

        return result[0] || null; // Возвращаем созданный отель или null, если вставка не произошла
    }

    async findByNameAndAddress(name: string, address: string): Promise<Hotels | undefined> {
        return this.hotelsRepository.findOne({ where: { name, address } });
    }

    async findHotelsWithSavePageById(id: string): Promise<Hotels[] | undefined> {
        return this.hotelsRepository.find({
            where: {
                id,
                page_loaded: true
            }
        })
    }

    async updateHotelPageLoaded(id: string, page_loaded: boolean): Promise<void> {
        await this.hotelsRepository.update(id, { page_loaded });
    }
}
