import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hotels } from './hotels.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HotelsRepository {
    constructor(
        @InjectRepository(Hotels)
        private hotelsRepository: Repository<Hotels>,
    ) {}

    async findAll(): Promise<Hotels[]> {
        return await this.hotelsRepository.find();
    }

    async findOne(id: string): Promise<Hotels> {
        return await this.hotelsRepository.findOneBy({ id });
    }

    async remove(id: string): Promise<void> {
        await this.hotelsRepository.delete(id);
    }

    async create(hotel: Partial<Hotels>): Promise<Hotels> {
        const newHotel = this.hotelsRepository.create(hotel);
        return await this.hotelsRepository.save(newHotel);
    }

    async findByNameAndAddress(name: string, address: string): Promise<Hotels | undefined> {
        return this.hotelsRepository.findOne({ where: { name, address } });
    }
}
