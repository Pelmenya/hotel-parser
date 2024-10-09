import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { ConfigModule } from '@nestjs/config';
import { CountryModule } from '../country/country.module';
import { FileModule } from '../file/file.module';
import { HotelModule } from '../hotel/hotel.module';

@Module({
  imports: [ConfigModule, CountryModule, HotelModule, FileModule],
  controllers: [ParserController],
  providers: [ParserService]
})
export class ParserModule { }
