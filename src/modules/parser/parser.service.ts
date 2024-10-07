import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';


@Injectable()
export class ParserService {
    constructor(private readonly configService: ConfigService) { }

    async parsePage(params: any) {
        console.log(params);
        const slug = params.slug;
        const url = this.configService.get('BASE_PARSE_URL') + `/${slug ? slug : ''}`; // Замените на реальный URL
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const countries = [];

            $('.uk-flex').each(async (index, element) => {
                const countryName = $(element).find('b').text().trim();
                countries.push(countryName);

            });

            return data;
        } catch (error) {
            return error.text;
        }
    };

    async parseCountries() {
        try {
            const data = await this.parsePage({ slug: 'strany-i-goroda' });
            const $ = cheerio.load(data);
            const countries = [];

            $('.uk-flex').each(async (index, element) => {
                const countryName = $(element).find('b').text().trim();
                countries.push(countryName);
            });

            return data;
        } catch (error) {
            return error;
        }
    }

}
