import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { TAbout } from '../abouts/abouts.types';
import { setDelay } from 'src/helpers/delay';
import { TranslationService } from '../translation/translation.service'; // Импортируем TranslationService

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
        private readonly translationService: TranslationService // Инъекция TranslationService
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
            if (parsedData.length < 2) {
                throw new Error('Parsed data does not contain both language responses');
            }
            return { ru: parsedData[0], en: parsedData[1] };
        } catch (error) {
            this.logger.error('Failed to generate hotel description, using TranslationService:', error);
            // Используем TranslationService для перевода данных
            const translatedData = await this.translateFallback(data);
            return translatedData;
        }
    }

    private async generateHotelDescription(data: TAbout, attempt = 1, maxAttempts = 6): Promise<string> {
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
                const delay = Math.min(20000, Math.pow(2, attempt - 1) * 1000); // Ограничение до 60 секунд
                this.logger.log(`Retrying in ${delay / 1000} seconds...`);
                await setDelay(delay);
                return this.generateHotelDescription(data, attempt + 1, maxAttempts);
            } else {
                throw new Error('Failed to generate hotel description after several attempts');
            }
        }
    }

    private isValidJsonResponse(content: string): boolean {
        try {
            JSON.parse(content);
            return true;
        } catch {
            return false;
        }
    }

    private parseResponse(content: string): TAbout[] {
        try {
            return JSON.parse(content);
        } catch (error) {
            this.logger.error('Ошибка при парсинге JSON:', error);
            return [];
        }
    }

    private async translateFallback(data: TAbout): Promise<TOpenAIDataRes> {
        const ruDescription = {
            ...data,
            aboutHotelDescriptionTitle: await this.translationService.translateText('description', data.aboutHotelDescriptionTitle, 'ru'),
            aboutHotelDescriptions: await Promise.all(data.aboutHotelDescriptions.map(async (descr) => ({
                ...descr,
                title: await this.translationService.translateText('description', descr.title, 'ru'),
                paragraph: await this.translationService.translateText('description', descr.paragraph, 'ru')
            })))
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
