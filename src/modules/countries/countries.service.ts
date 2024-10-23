import { Injectable } from '@nestjs/common';
import { ParserService } from '../parser/parser.service';
import { CountriesRepository } from './countries.repository';
import * as cheerio from 'cheerio';

@Injectable()
export class CountriesService {
    constructor(
        private readonly parseService: ParserService,
        private readonly countriesRepository: CountriesRepository,
    ) { }
    
    async createCountries() {
        try {
            const data = await this.parseService.parsePage({ slug: 'strany-i-goroda' });
            const $ = cheerio.load(data);

            const getCountry = async () => {
                const promises = [];
                $('.uk-flex').each((index, element) => {
                    const countryName = $(element).find('b').text().trim();
                    const promise = this.countriesRepository.create({
                        name: countryName,
                    });
                    promises.push(promise);
                });
                return Promise.all(promises);
            };

            await getCountry();
            const countries = await this.countriesRepository.findAll();
            return countries;
        } catch (error) {
            console.error('Error parsing countries:', error);
            return error;
        }
    }
}
