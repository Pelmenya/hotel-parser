import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Districts } from './districts.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DistrictsRepository {
    constructor(
        @InjectRepository(Districts)
        private districtsRepository: Repository<Districts>,
    ) { }

    async findAll(): Promise<Districts[]> {
        return await this.districtsRepository.find();
    }

    async findOne(id: string): Promise<Districts> {
        return await this.districtsRepository.findOneBy({ id });
    }

    async remove(id: string): Promise<void> {
        await this.districtsRepository.delete(id);
    }

    async create(district: Partial<Districts>): Promise<Districts> {
        const newDistrict = this.districtsRepository.create(district);
        return await this.districtsRepository.save(newDistrict);
    }

    async findByNameAndLink(name: string, district_link_ostrovok: string): Promise<Districts | undefined> {
        return this.districtsRepository.findOne({ where: { name, district_link_ostrovok } });
    }

    async updateCountPages(id: string, countPages: number): Promise<void> {
        await this.districtsRepository.update(id, { count_pages: countPages });
    }
    
}
