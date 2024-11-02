import { Module } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationDictionary } from './translation-dictionary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TranslationDictionary])
  ],
  providers: [TranslationService],
  controllers: [TranslationController],
  exports: [TranslationService]
})
export class TranslationModule {}
