import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { CountryRepository } from '../country/country.repository';

@Injectable()
export class ParserService {
    constructor(
        private readonly configService: ConfigService,
        private readonly countriesRepository: CountryRepository
    ) { }

    async parsePage(params: any) {
        const slug = params.slug;
        const url = this.configService.get('BASE_PARSE_URL') + `/${slug ? slug : ''}`; // Замените на реальный URL
        try {
            const data  = await this.loadFullPageWithLocalProxy(url);
            console.log(data)
            return data
        } catch (error) {
            console.log(error)
            return error.text;
        }
    };

    async parseCountries() {
        try {
            const data = await this.parsePage({ slug: 'strany-i-goroda' });
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
            return error;
        }
    }

    async getCountPageOfHotelsInCountry(country: string) {

    }

    async loadFullPageWithLocalProxy(url: string) {
        const browser = await puppeteer.launch({
            args: ['--proxy-server=http://squid:3128', '--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.goto(url);
    
        // Ваши действия на странице
        const content = await page.content();

        await browser.close();
        return content;
    }
}
