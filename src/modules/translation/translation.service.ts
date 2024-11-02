import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as jose from 'node-jose';
import Bottleneck from 'bottleneck';

@Injectable()
export class TranslationService {
  private limiter = new Bottleneck({
    reservoir: 20, // Вызовов в секунду
    reservoirRefreshAmount: 20,
    reservoirRefreshInterval: 1000, // 1 секунда
  });

  private symbolsUsed = 0;
  private lastReset = Date.now();

  constructor(private readonly configService: ConfigService) {}

  private resetSymbolsCounter() {
    const now = Date.now();
    if (now - this.lastReset >= 3600000) { // 3600000 мс = 1 час
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

  public async translateText(text: string, targetLang: string): Promise<string> {
    this.resetSymbolsCounter();

    if (this.symbolsUsed + text.length > 1_000_000) {
      throw new Error('Превышен лимит символов в час');
    }

    return this.limiter.schedule(async () => {
      const iamToken = await this.getIamToken();
      const folderId = this.configService.get<string>('YA_FOLDER_ID');

      const response = await axios.post(
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

      this.symbolsUsed += text.length;

      return response.data.translations[0].text;
    });
  }
  
}
