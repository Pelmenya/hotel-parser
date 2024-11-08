import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { TAbout } from '../abouts/abouts.types';
import { setDelay } from 'src/helpers/delay';
import { TranslationService } from '../translation/translation.service';

export type TOpenAIDataRes = {
    ru: TAbout;
    en: TAbout;
}

@Injectable()
export class OpenAIService {
    private readonly logger = new Logger(OpenAIService.name);
    private openAI: OpenAI;
    private openAIModel: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly translationService: TranslationService
    ) {
        this.openAI = new OpenAI({
            apiKey: this.configService.get('OPENAI_API_KEY'),
            baseURL: this.configService.get('OPENAI_BASE_API_URL')
        });
        this.openAIModel = this.configService.get('OPENAI_MODEL');
    }

    async generate(data: TAbout): Promise<TOpenAIDataRes> {
        try {
            const content = await this.generateHotelDescription(data);
            const parsedData = this.parseResponse(content);
            if (parsedData.ru && parsedData.en) {
                return parsedData;
            } else {
                throw new Error('Parsed data does not contain both language responses');
            }
        } catch (error) {
            this.logger.error('Failed to generate hotel description, falling back to TranslationService:', error);
            return this.translateFallback(data);
        }
    }

    private async generateHotelDescription(data: TAbout, attempt = 1, maxAttempts = 10): Promise<string> {
        try {
            const chatCompletion = await this.openAI.chat.completions.create({
                messages: [{
                    role: 'user',
                    content: `
                      Улучшите следующие описания 
                      отеля для SEO, используя релевантные 
                      ключевые слова и улучшая структуру текста. 
                      Верните результат исключительно в формате JSON, 
                      без дополнительного текста, 
                      на русском и английском языках. 
                      Данные должны быть структурированы в два отдельных JSON-блока: 
                      один для русского, другой для английского.
                      ${JSON.stringify(data)}`
                }],
                model: this.openAIModel,
                temperature: 0.7,
                max_tokens: 1500,
            });

            const content = chatCompletion.choices[0].message.content;
            this.logger.debug('Received content:', content);
            
            if (!this.isValidJsonResponse(content)) {
                throw new Error('Invalid JSON response');
            }

            return content;

        } catch (error) {
            this.logger.error(`Error in generating hotel description (attempt ${attempt}):`, error);

            if (attempt < maxAttempts) {
                const delay = Math.min(60000, Math.pow(2, attempt - 1) * 1000);
                this.logger.log(`Retrying in ${delay / 1000} seconds...`);
                await setDelay(delay);
                return this.generateHotelDescription(data, attempt + 1, maxAttempts);
            } else {
                this.logger.warn('Max attempts reached. Falling back to translation service.');
                const fallbackData = await this.translateFallback(data);
                return JSON.stringify(fallbackData);
            }
        }
    }

    private isValidJsonResponse(content: string): boolean {
        return content.includes('{') && content.includes('}');
    }

    private parseResponse(content: string): TOpenAIDataRes {
        try {
            // Используем регулярное выражение для извлечения текстов между тройными кавычками
            const regex = /```(?:json)?\n([\s\S]*?)\n```/g;
            const matches = [];
            let match;
            while ((match = regex.exec(content)) !== null) {
                matches.push(match[1].trim());
            }

            if (matches.length !== 2) {
                throw new Error('Unexpected number of JSON blocks');
            }

            const ruData = JSON.parse(matches[0]);
            const enData = JSON.parse(matches[1]);

            return { ru: ruData, en: enData };
        } catch (error) {
            this.logger.error('Ошибка при парсинге JSON:', error);
            return { ru: null, en: null };
        }
    }

    private async translateFallback(data: TAbout): Promise<TOpenAIDataRes> {
        const ruDescription = {
            ...data,
        };

        const enDescription = {
            ...data,
            aboutHotelDescriptionTitle: await this.translationService.translateText('description', data.aboutHotelDescriptionTitle, 'en'),
            aboutHotelDescriptions: await Promise.all(data.aboutHotelDescriptions.map(async (descr) => ({
                ...descr,
                title: await this.translationService.translateText('description', descr.title, 'en'),
                paragraph: await this.translationService.translateText('description', descr.paragraph, 'en')
            })))
        };

        return { ru: ruDescription, en: enDescription };
    }
}
