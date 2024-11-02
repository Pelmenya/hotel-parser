import { Module } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationDictionary } from './translation-dictionary.entity';
import { TransportModule } from '../transport/transport.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TranslationDictionary]),
    TransportModule,
  ],
  providers: [TranslationService],
  controllers: [TranslationController],
  exports: [TranslationService]
})
export class TranslationModule {}
