import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Locations } from './locations.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LocationsRepository {
  constructor(
    @InjectRepository(Locations)
    private locationsRepository: Repository<Locations>,
  ) { }

  async save(location: Locations): Promise<Locations> {
    return this.locationsRepository.save(location);
  }

  async findAll() {
    return this.locationsRepository.find();
  }
}
