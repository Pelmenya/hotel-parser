import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Districts } from './districts.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DistrictsRepository {
    constructor(
        @InjectRepository(Districts)
        private districtsRepository: Repository<Districts>,
    ) {}

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

    async updateCountPages(id: string, count_pages: number, region: string | null, count_hotels: number | null): Promise<void> {
        await this.districtsRepository.update(id, { count_pages, region, count_hotels });
    }

    async findByLink(district_link_ostrovok: string): Promise<Districts | undefined> {
        return this.districtsRepository.findOne({ where: { district_link_ostrovok } });
    }

    // Новый метод для обновления обработанных страниц
    async updateProcessedPages(id: string, processed_pages: number[]): Promise<void> {
        await this.districtsRepository.update(id, { processed_pages });
    }

    // Новый метод для обновления статуса, что все страницы загружены
    async updateAllPagesLoaded(id: string, all_pages_loaded: boolean): Promise<void> {
        await this.districtsRepository.update(id, { all_pages_loaded });
    }
}
