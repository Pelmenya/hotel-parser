import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { TAbout } from '../abouts/abouts.types';
import { setDelay } from 'src/helpers/delay';
import { TranslationService } from '../translation/translation.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export type TOpenAIDataRes = {
    ru: TAbout;
    en: TAbout;
}

@Injectable()
export class OpenAIService {
    private openAI: OpenAI;
    private openAIModel: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly translationService: TranslationService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {
        this.openAI = new OpenAI({
            apiKey: this.configService.get('OPENAI_API_KEY'),
            baseURL: this.configService.get('OPENAI_BASE_API_URL')
        });
        this.openAIModel = this.configService.get('OPENAI_MODEL');
    }

    async generate(data: TAbout): Promise<TOpenAIDataRes> {
        let attempt = 0;
        const maxAttempts = 3;

        while (attempt < maxAttempts) {
            try {
                const content = await this.generateHotelDescription(data);
                const parsedData = this.parseResponse(content);

                if (this.isValidTAbout(parsedData.ru) && this.isValidTAbout(parsedData.en)) {
                    return parsedData;
                } else {
                    throw new Error('Parsed data does not contain valid language responses');
                }
            } catch (error) {
                this.logger.error('Failed to generate hotel description, retrying:', error);
                attempt++;
                if (attempt >= maxAttempts) {
                    this.logger.error('Max attempts reached, falling back to TranslationService');
                    return this.translateFallback(data);
                }
                const delay = Math.min(60000, Math.pow(2, attempt - 1) * 1000);
                this.logger.warn(`Retrying in ${delay / 1000} seconds...`);
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
                    Описание:
                    ${JSON.stringify(data)}

                    Пример правильного формата ответа:
                    **Русский язык**
                    \`\`\`json
                    {
                      "aboutHotelDescriptionTitle": "",
                      "aboutHotelDescriptions": [
                        {
                          "idx": 0,
                          "title": "",
                          "paragraph": ""
                        }
                          ...
                      ]
                    }
                    \`\`\`

                    **Английский язык**
                    \`\`\`json
                    {
                      "aboutHotelDescriptionTitle": "",
                      "aboutHotelDescriptions": [
                        {
                          "idx": 0,
                          "title": "",
                          "paragraph": ""
                        }
                          ...
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
            const matches = [];
            const regexWithQuotes = /```(?:json)?\n([\s\S]*?)\n```/g;
            let match;
            while ((match = regexWithQuotes.exec(content)) !== null) {
                matches.push(match[1].trim());
            }

            if (matches.length < 2) {
                const regexWithoutQuotes = /\{(?:[^{}]*|{[^{}]*})*\}/g;
                matches.length = 0;
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

    private isValidTAbout(data: any): data is TAbout {
        if (!data || typeof data !== 'object') return false;
        if (typeof data.aboutHotelDescriptionTitle !== 'string') return false;
        if (!Array.isArray(data.aboutHotelDescriptions)) return false;

        return data.aboutHotelDescriptions.every((desc: any) =>
            typeof desc.idx === 'number' &&
            typeof desc.title === 'string' &&
            typeof desc.paragraph === 'string'
        );
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

    async translateHotelNameToEnglish(name: string) {
        const chatCompletion = await this.openAI.chat.completions.create({
            messages: [{
                role: 'user',
                content: `Translate the following hotel name from Russian to English, ensuring that it maintains the original context and appeal. Only provide the translated name without any additional text: \"{${name}}\".`
            }],
            model: this.openAIModel,
            temperature: 0.7,
            max_tokens: 1500,
        });

        const translatedName = chatCompletion.choices[0].message.content.replace(/^\s+|\s+$/g, '').replace(/^["']|["']$/g, '');

        await this.translationService.saveTranslationToDictionary('hotel name', name, translatedName, 'en');

        return translatedName;

    }


}
