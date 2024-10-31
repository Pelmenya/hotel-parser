import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
    private openAI: OpenAI;
    constructor(
        private readonly configService: ConfigService
    )  {
        this.openAI = new OpenAI({
            apiKey: this.configService.get('OPENAI_API_KEY'),
            baseURL: this.configService.get('OPENAI_BASE_API_URL')
          });
    }

    async generateHotelDescription() {

    }

}
