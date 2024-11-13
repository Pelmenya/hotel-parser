import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as jose from 'node-jose';
import Bottleneck from 'bottleneck';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TranslationDictionary } from './translation-dictionary.entity';
import { TransportService } from '../transport/transport.service';
import { TTranslationName } from './translation.types';
import { setDelay } from 'src/helpers/delay';
import { TLanguage } from 'src/types/t-language';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private axiosInstance: AxiosInstance;
  private limiter = new Bottleneck({
    reservoir: 10,
    reservoirRefreshAmount: 10,
    reservoirRefreshInterval: 1000,
    minTime: 100,
  });

  private symbolsUsed = 0;
  private lastReset = Date.now();
  private iamToken: string;
  private iamTokenExpiry: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly transportService: TransportService,
    @InjectRepository(TranslationDictionary)
    private readonly translationRepository: Repository<TranslationDictionary>,
  ) {
    this.axiosInstance = this.transportService.getAxiosInstance();
  }

  private resetSymbolsCounter() {
    const now = Date.now();
    if (now - this.lastReset >= 3600000) {
      this.symbolsUsed = 0;
      this.lastReset = now;
    }
  }

  private async getIamTokenWithRetry(retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const json = JSON.parse(fs.readFileSync(this.configService.get<string>('KEY_FILE_PATH'), 'utf8'));
        const { private_key, service_account_id, id } = json;

        const now = Math.floor(Date.now() / 1000);
        const payload = {
          aud: this.configService.get<string>('IAM_TOKEN_URL'),
          iss: service_account_id,
          iat: now,
          exp: now + 3600,
        };

        const key = await jose.JWK.asKey(private_key, 'pem', { kid: id, alg: 'PS256' });
        const jws = await jose.JWS.createSign({ format: 'compact' }, key)
          .update(JSON.stringify(payload))
          .final();

        const response = await axios.post(this.configService.get<string>('IAM_TOKEN_URL'), {
          jwt: jws,
        });

        this.iamToken = response.data.iamToken;
        this.iamTokenExpiry = now + 3600;
        return this.iamToken;
      } catch (error) {
        this.logger.error(`Failed to get IAM token on attempt ${attempt}`, error.stack);
        if (attempt === retries) {
          throw new Error('Failed to get IAM token after multiple attempts');
        }
        await setDelay(1000 * attempt);
      }
    }
  }

  private async getIamToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (!this.iamToken || now >= this.iamTokenExpiry) {
      return await this.getIamTokenWithRetry();
    }
    return this.iamToken;
  }

  private async getTranslationFromDictionary(text: string, targetLang: string): Promise<string | null> {
    try {
      const translation = await this.translationRepository.findOne({ where: { original_text: text, language: targetLang } });
      return translation ? translation.translated_text : null;
    } catch (error) {
      this.logger.error('Failed to retrieve translation from dictionary', error.stack);
      throw new Error('Failed to retrieve translation from dictionary');
    }
  }

  private async saveTranslationToDictionary(name: TTranslationName, originalText: string, translatedText: string, targetLang: string) {
    try {
      let translation = await this.translationRepository.findOne({
        where: { original_text: originalText, language: targetLang },
      });

      if (translation) {
        // Если запись уже существует, просто обновляем её
        translation.name = name;
        translation.translated_text = translatedText;
        translation.updated_at = new Date();
      } else {
        // Если записи нет, создаем новую
        translation = this.translationRepository.create({
          name,
          original_text: originalText,
          translated_text: translatedText,
          language: targetLang,
        });
      }

      await this.translationRepository.save(translation);
    } catch (error) {
      this.logger.error('Failed to save translation to dictionary', error.stack);
      throw new Error('Failed to save translation to dictionary');
    }
  }


  public async translateText(name: TTranslationName, text: string, targetLang: TLanguage): Promise<string> {
    this.resetSymbolsCounter();

    if (this.symbolsUsed + text.length > 1_000_000) {
      throw new Error('Exceeded symbol limit per hour');
    }

    const cachedTranslation = await this.getTranslationFromDictionary(text, targetLang);
    if (cachedTranslation) {
      return cachedTranslation;
    }

    return this.limiter.schedule(async () => {
      try {
        const iamToken = await this.getIamToken();
        const folderId = this.configService.get<string>('YA_FOLDER_ID');

        const response = await this.axiosInstance.post(
          this.configService.get<string>('TRANSLATE_API_URL'),
          {
            folderId,
            texts: [text],
            targetLanguageCode: targetLang,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${iamToken}`,
            },
          },
        );

        const translatedText = response.data.translations[0].text;
        await this.saveTranslationToDictionary(name, text, translatedText, targetLang);

        this.symbolsUsed += text.length;

        return translatedText;
      } catch (error) {
        this.logger.error('Failed to translate text', error.stack);
        if (error.response && error.response.status === 429) {
          await setDelay(1000);
          return this.translateText(name, text, targetLang);
        }
        throw new Error('Failed to translate text');
      }
    });
  }
}
