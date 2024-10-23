import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as puppeteer from 'puppeteer';
import { FilesService } from '../files/files.service';
import { SocksProxyAgent } from 'socks-proxy-agent';

export type TParserLoadContent = 'puppeteer' | 'axios';

@Injectable()
export class ParserService {
    private axiosInstance: AxiosInstance;
    private proxyUrl: string;
    private instanceId: 1;
    private totalInstances: 1;
    constructor(
        private readonly configService: ConfigService,
        private readonly filesService: FilesService,
    ) {
        const proxyHost = this.configService.get('PROXY_HOST');
        const proxyPort = this.configService.get('PROXY_PORT');
        const proxyUsername = this.configService.get('PROXY_LOGIN');
        const proxyPassword = this.configService.get('PROXY_PASSWORD');
        this.proxyUrl = `socks5://${proxyUsername}:${proxyPassword}@${proxyHost}:${proxyPort}`;

        const socksAgent = new SocksProxyAgent(this.proxyUrl);

        this.axiosInstance = axios.create({
            httpAgent: socksAgent,
            httpsAgent: socksAgent,
        });

        this.checkIP();
    }

    async parsePage(params: any = '', type: TParserLoadContent = 'axios', retries: number = 3) {
        console.log('Parse page from url: ', params);
        const url = this.configService.get('BASE_PARSE_URL') + params;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const { data } = type === 'axios'
                    ? await this.axiosInstance.get(url)
                    : { data: await this.loadFullPageWithLocalProxy(url) };
                return data;
            } catch (error) {
                console.error(`Attempt ${attempt} - Error fetching page data:`, error.message);
                if (attempt === retries) {
                    return { error: `Failed after ${retries} attempts`, message: error.message };
                }
                await this.delay(2000); // задержка между попытками
            }
        }
    }

    async parseHotelsByPage(page: number, district: string = '') {
        const data = await this.parsePage(`?page=${page}`);
        if (data.error) {
            console.error(`Failed to fetch data for page ${page}:`, data.message);
        }
        await this.filesService.saveDataToJsonFile(data, `page_${page}.json`, 'pages');
        return data;
    }


    async parseRussianHotels(start: number, end: number) {
        const promises = [];
        for (let i = start; i <= end; i++) {
            promises.push(this.delayedParseHotelsByPage(i, (i - start + 1) * 4000));
        }
        await Promise.all(promises);
        return { success: true };
    }

    delayedParseHotelsByPage(page: number, delay: number) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const data = await this.parseHotelsByPage(page);
                    resolve(data);
                } catch (error) {
                    console.error('Ошибка при парсинге отелей на странице', page, ':', error);
                    reject(error);
                }
            }, delay);
        });
    }


    async loadFullPageWithLocalProxy(url: string) {
        const browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                `--proxy-server=${this.proxyUrl}`
            ],
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'load', timeout: 0 });

        const content = await page.content();

        await browser.close();
        return content;
    }


    async checkIP() {
        try {
            const response = await this.axiosInstance.get('https://api.ipify.org');
            console.log('Your IP through proxy is:', response.data);
        } catch (error) {
            console.error('Error checking IP:', error);
        }
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
