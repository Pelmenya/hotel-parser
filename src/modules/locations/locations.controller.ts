import { Controller, Get, Post, Query } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
    constructor(
        private readonly locationsRepository: LocationsRepository,
        private readonly locationsService: LocationsService
    ) { }

    @Get()
    async getAllocations() {

        return this.locationsRepository.findAll();
    }

    // Эндпоинт для запуска перевода адресов пачками
    @Post('translate')
    async translateLocations(@Query() params: { batch: number }) {
        try {
            const res = await this.locationsService.translateAddressesFromRussianToEnglish(params.batch);
            return { message: 'Translation process completed successfully', res };
        } catch (error) {
            return { message: 'Failed to translate locations', error: error.message };
        }
    }

}
