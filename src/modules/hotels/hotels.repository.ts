// hotels.repository.ts
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

    async createIfNotExists(hotel: Partial<Hotels>): Promise<Hotels | null> {
        const existingHotel = await this.hotelsRepository.findOne({
            where: { hotel_link_ostrovok: hotel.hotel_link_ostrovok },
        });

        if (existingHotel) {
            console.log(`Hotel already exists: ${hotel.name}, ${hotel.address}`);
            return null;
        }

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
            hotel.district ? hotel.district.id : null,
        ]);

        return result[0] || null;
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
        });
    }

    async updateHotelPageLoaded(id: string, page_loaded: boolean): Promise<void> {
        await this.hotelsRepository.update(id, { page_loaded });
    }

    async save(hotel: Hotels): Promise<Hotels> {
        return this.hotelsRepository.save(hotel);
    }

    async lockHotelsForProcessing(instanceId: number, batchSize: number): Promise<Hotels[]> {
        const hotels = await this.hotelsRepository.find({
            where: {
                page_loaded: false,
                locked_by: null,
            },
            order: {
                id: 'ASC',
            },
            take: batchSize,
        });

        await Promise.all(hotels.map(hotel => {
            return this.hotelsRepository.update(hotel.id, { locked_by: instanceId.toString() });
        }));

        return hotels;
    }

    async unlockHotel(id: string): Promise<void> {
        await this.hotelsRepository.update(id, { locked_by: null });
    }
}
