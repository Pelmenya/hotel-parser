import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { ConfigModule } from '@nestjs/config';
import { CountryModule } from '../country/countries.module';
import { FilesModule } from '../file/files.module';
import { HotelsModule } from '../hotel/hotels.module';

@Module({
  imports: [ConfigModule, CountryModule, HotelsModule, FilesModule],
  controllers: [ParserController],
  providers: [ParserService]
})
export class ParserModule { }
