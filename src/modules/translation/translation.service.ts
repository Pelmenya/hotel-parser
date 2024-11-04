import { Injectable } from '@nestjs/common';
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

@Injectable()
export class TranslationService {
  private axiosInstance: AxiosInstance;
  private limiter = new Bottleneck({
    reservoir: 10,  // Уменьшить количество запросов
    reservoirRefreshAmount: 10,
    reservoirRefreshInterval: 1000,
    minTime: 100  // Минимальное время между запросами
  });

  private symbolsUsed = 0;
  private lastReset = Date.now();

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

  private async getIamToken(): Promise<string> {
    const json = JSON.parse(fs.readFileSync(this.configService.get<string>('KEY_FILE_PATH'), 'utf8'));
    const { private_key, service_account_id, id } = json;

    const now = Math.floor(new Date().getTime() / 1000);
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

    return response.data.iamToken;
  }

  private async getTranslationFromDictionary(text: string, targetLang: string): Promise<string | null> {
    const translation = await this.translationRepository.findOne({ where: { original_text: text, language: targetLang } });
    return translation ? translation.translated_text : null;
  }

  private async saveTranslationToDictionary(name: TTranslationName, originalText: string, translatedText: string, targetLang: string) {
    const translation = this.translationRepository.create({
      name,
      original_text: originalText,
      translated_text: translatedText,
      language: targetLang,
    });
    await this.translationRepository.save(translation);
  }

  public async translateText(name: TTranslationName, text: string, targetLang: string): Promise<string> {
    this.resetSymbolsCounter();

    if (this.symbolsUsed + text.length > 1_000_000) {
      throw new Error('Превышен лимит символов в час');
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
        if (error.response && error.response.status === 429) {
          // Применяем экспоненциальную задержку
          await setDelay(1000);
          return this.translateText(name, text, targetLang);
        }
        throw error;
      }
    });
  }
}
