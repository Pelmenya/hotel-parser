import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocksProxyAgent } from 'socks-proxy-agent';
import axios, { AxiosInstance } from 'axios';
import * as puppeteer from 'puppeteer';

export type TTransportLoadContent = 'puppeteer' | 'axios';
@Injectable()
export class TransportService {
    private axiosInstance: AxiosInstance;
    private proxyUrl: string;

    constructor(private readonly configService: ConfigService) {
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

    getAxiosInstance() {
        return this.axiosInstance;
    }
   
    async loadFullPageWithProxy(url: string) {
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

}
