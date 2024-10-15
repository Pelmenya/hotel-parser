import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Countries } from './countries.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CountriesRepository {
    constructor(
        @InjectRepository(Countries)
        private countriesRepository: Repository<Countries>,
      ) {}
    
      async findAll(): Promise<Countries[]> {
        return await this.countriesRepository.find();
      }
    
      async findOne(id: string): Promise<Countries> {
        return await this.countriesRepository.findOneBy({ id: Number(id) });
      }
    
      async remove(id: string): Promise<void> {
        await this.countriesRepository.delete(id);
      }
    
      async create(hotel: Partial<Countries>): Promise<Countries> {
        const newCountries = this.countriesRepository.create(hotel);
        return await this.countriesRepository.save(newCountries);
      }
}
