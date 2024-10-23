import { Controller, Get, Post } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
    constructor(
        private readonly countriesService: CountriesService
    ) {}

    @Post()
    async createCountries(): Promise<string> {
        return await this.countriesService.createCountries();
    }
}
