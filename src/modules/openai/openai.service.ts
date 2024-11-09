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
        let attempt = 0;
        const maxAttempts = 10;

        while (attempt < maxAttempts) {
            try {
                const content = await this.generateHotelDescription(data);
                const parsedData = this.parseResponse(content);

                if (parsedData.ru && parsedData.en) {
                    return parsedData;
                } else {
                    throw new Error('Parsed data does not contain both language responses');
                }
            } catch (error) {
                this.logger.error('Failed to generate hotel description, retrying:', error);
                attempt++;
                if (attempt >= maxAttempts) {
                    this.logger.error('Max attempts reached, falling back to TranslationService');
                    return this.translateFallback(data);
                }
                const delay = Math.min(60000, Math.pow(2, attempt - 1) * 1000);
                this.logger.log(`Retrying in ${delay / 1000} seconds...`);
                await setDelay(delay);
            }
        }
    }

    private async generateHotelDescription(data: TAbout): Promise<string> {
        const chatCompletion = await this.openAI.chat.completions.create({
            messages: [{
                role: 'user',
                content: `
                    Улучшите следующие описания отеля для SEO, используя релевантные ключевые слова и улучшая структуру текста.
                    Верните результат исключительно в формате JSON, без дополнительного текста, на русском и английском языках.
                    Данные должны быть структурированы в два отдельных JSON-блока: один для русского, другой для английского.

                    Пример правильного формата ответа:
                    **Русский язык**
                    \`\`\`json
                    {
                      "aboutHotelDescriptionTitle": "Уютные апартаменты в центре города",
                      "aboutHotelDescriptions": [
                        {
                          "idx": 0,
                          "title": "Расположение",
                          "paragraph": "Апартаменты расположены в самом сердце города, в шаговой доступности от главных достопримечательностей."
                        }
                      ]
                    }
                    \`\`\`

                    **Английский язык**
                    \`\`\`json
                    {
                      "aboutHotelDescriptionTitle": "Cozy apartments in the city center",
                      "aboutHotelDescriptions": [
                        {
                          "idx": 0,
                          "title": "Location",
                          "paragraph": "The apartments are located in the heart of the city, within walking distance of major attractions."
                        }
                      ]
                    }
                    \`\`\`

                    Пример неправильного формата ответа (не используйте этот формат):
                    Текстовый ответ или ответ не в формате JSON.
                    `
            }],
            model: this.openAIModel,
            temperature: 0.7,
            max_tokens: 1500,
        });

        const content = chatCompletion.choices[0].message.content;
        this.logger.debug('Received content:', content);

        return content;
    }

    private parseResponse(content: string): TOpenAIDataRes {
        try {
            // Попробуем извлечь JSON-блоки с помощью двух подходов: с кавычками и без них
            const matches = [];
            const regexWithQuotes = /```(?:json)?\n([\s\S]*?)\n```/g;
            let match;
            while ((match = regexWithQuotes.exec(content)) !== null) {
                matches.push(match[1].trim());
            }
    
            // Если не нашли блоков с кавычками, пробуем найти просто JSON-объекты
            if (matches.length < 2) {
                const regexWithoutQuotes = /\{(?:[^{}]*|{[^{}]*})*\}/g;
                matches.length = 0; // очищаем массив
                while ((match = regexWithoutQuotes.exec(content)) !== null) {
                    matches.push(match[0].trim());
                }
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
