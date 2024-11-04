import { Controller, Get, Query } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TTranslationName } from './translation.types';

@Controller('translate')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  async translate(@Query('name') name: TTranslationName, @Query('text') text: string, @Query('lang') lang: string): Promise<string> {
    return this.translationService.translateText(name, text, lang);
  }
}
