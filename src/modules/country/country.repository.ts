import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Country } from './country.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CountryRepository {
    constructor(
        @InjectRepository(Country)
        private countriesRepository: Repository<Country>,
      ) {}
    
      async findAll(): Promise<Country[]> {
        return await this.countriesRepository.find();
      }
    
      async findOne(id: string): Promise<Country> {
        return await this.countriesRepository.findOneBy({ id: Number(id) });
      }
    
      async remove(id: string): Promise<void> {
        await this.countriesRepository.delete(id);
      }
    
      async create(hotel: Partial<Country>): Promise<Country> {
        const newCountry = this.countriesRepository.create(hotel);
        return await this.countriesRepository.save(newCountry);
      }
}
