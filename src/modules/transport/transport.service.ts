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
    private proxyUrlPuppeteer: string;
    private proxyUsername: string;
    private proxyPassword: string;


    constructor(private readonly configService: ConfigService) {
        const proxyHost = this.configService.get('PROXY_HOST');
        const proxyPort = this.configService.get('PROXY_PORT');
        this.proxyUsername = this.configService.get('PROXY_LOGIN');
        this.proxyPassword = this.configService.get('PROXY_PASSWORD');

        this.proxyUrl = `socks5://${this.proxyUsername}:${this.proxyPassword}@${proxyHost}:${proxyPort}`;
        this.proxyUrlPuppeteer = `socks5://${proxyHost}:${proxyPort}`;; // убедитесь, что порт совпадает

        const socksAgent = new SocksProxyAgent(this.proxyUrl);

        this.axiosInstance = axios.create({
            httpAgent: socksAgent,
            httpsAgent: socksAgent,
        });

        this.checkAxiosIP();
        this.checkPuppeteerIP();
    }

    getAxiosInstance() {
        return this.axiosInstance;
    }

    async loadFullPageWithProxy(url: string) {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                `--proxy-server=${this.proxyUrlPuppeteer}`
            ],
        });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'load', timeout: 0 });

        const content = await page.content();

        await browser.close();
        return content;
    }

    async checkAxiosIP() {
        try {
            const response = await this.axiosInstance.get('https://api.ipify.org');
            console.log('Your IP through proxy is:', response.data);
        } catch (error) {
            console.error('Error checking IP:', error);
        }
    }

    async checkPuppeteerIP() {
        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    `--proxy-server=${this.proxyUrlPuppeteer}`
                ]
            });
            const page = await browser.newPage();
            await page.authenticate({
                username: this.proxyUsername,
                password: this.proxyPassword
            });
            await page.goto('https://api.ipify.org', { waitUntil: 'networkidle2' });
            const content = await page.evaluate(() => document.body.textContent);
            console.log('Your IP through Puppeteer is:', content);
            await browser.close();
        } catch (error) {
            console.error('Puppeteer error:', error);
        }
    }
}
