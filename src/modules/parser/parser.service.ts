import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';


@Injectable()
export class ParserService {
    async parseCountries() {
        const url = 'https://top10-hotel.ru/strany-i-goroda/'; // Замените на реальный URL
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
          return  error.text;
        }
      }
    
}
