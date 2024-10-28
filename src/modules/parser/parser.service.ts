import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransportService, TTransportLoadContent } from '../transport/transport.service';
import * as cheerio from 'cheerio';


@Injectable()
export class ParserService {
    constructor(
        private readonly configService: ConfigService,
        private readonly transporService: TransportService,
    ) { }

    async parsePage(params: any = '', type: TTransportLoadContent = 'axios', retries: number = 3) {
        console.log('Parse page from url: ', params);
        const url = this.configService.get('BASE_PARSE_URL') + params;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const { data } = type === 'axios'
                    ? await this.transporService.getAxiosInstance().get(url)
                    : { data: await this.transporService.loadFullPageWithProxy(url) };
                    const $ = cheerio.load(data);
                    console.log($('.HotelHeader_name__hWIU0').text())
            
                return data;
            } catch (error) {
                console.error(`Attempt ${attempt} - Error fetching page data:`, error.message);
                if (attempt === retries) {
                    return { error: `Failed after ${retries} attempts`, message: error.message };
                }
            }
        }
    }

}
