import { Controller, Get } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';

@Controller('locations')
export class LocationsController {
    constructor(
        private readonly locationsRepository: LocationsRepository) { }

    @Get()
    async getAllocations() {

        return this.locationsRepository.findAll();
    }

    
}
