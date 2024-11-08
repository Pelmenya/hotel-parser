import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ConfigModule } from '@nestjs/config';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [ConfigModule, TranslationModule],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenaiModule {}
