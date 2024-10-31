import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { TAboutHotel } from '../hotels/hotel.types';
import { setDelay } from 'src/helpers/delay';

@Injectable()
export class OpenAIService {
    private readonly logger = new Logger(OpenAIService.name);
    private openAI: OpenAI;
    constructor(
        private readonly configService: ConfigService
    ) {
        this.openAI = new OpenAI({
            apiKey: this.configService.get('OPENAI_API_KEY'),
            baseURL: this.configService.get('OPENAI_BASE_API_URL')
        });
    }

    async generate(data: TAboutHotel) {
        const content = await this.generateHotelDescription(data);
        const parsedData = this.parseResponse(content);
        return { ru: parsedData[0], en: parsedData[1] };
    };

    async generateHotelDescription(data: TAboutHotel, attempt = 1, maxAttempts = 5): Promise<string> {
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
                model: 'llama-3.1-405b-instruct:free',
                temperature: 0.7,
                max_tokens: 1500,
            });
    
            const content = chatCompletion.choices[0].message.content;
    
            // Валидация формата ответа
            if (!this.isValidJsonResponse(content)) {
                throw new Error('Invalid JSON response');
            }
    
            return content;
    
        } catch (error) {
            this.logger.error(`Error in generating hotel description (attempt ${attempt}):`, error);
    
            if (attempt < maxAttempts) {
                // Рассчитываем задержку перед следующей попыткой
                const delay = Math.pow(2, attempt - 1) * 1000; // 1000 ms = 1 second
                this.logger.log(`Retrying in ${delay / 1000} seconds...`);
    
                // Делаем задержку перед следующим вызовом
                await setDelay(delay);
    
                // Рекурсивный вызов с увеличенной попыткой
                return this.generateHotelDescription(data, attempt + 1, maxAttempts);
            } else {
                throw new Error('Failed to generate hotel description after several attempts');
            }
        }
    }
    
    private isValidJsonResponse(content: string): boolean {
        // Простая проверка на наличие JSON-блоков (можно улучшить для конкретного формата)
        const regex = /```json\n([\s\S]*?)\n```/g;
        return regex.test(content);
    }

    parseResponse(content: string) {
        // Регулярное выражение для извлечения JSON-блоков
        const regex = /```json\n([\s\S]*?)\n```/g;
        let match: string[];
        const parsedData = [];

        while ((match = regex.exec(content)) !== null) {
            try {
                parsedData.push(JSON.parse(match[1]));
            } catch (error) {
                this.logger.error('Ошибка при парсинге JSON:', error);
            }
        }

        return parsedData;
    }

}
