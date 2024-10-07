import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { ConfigModule } from '@nestjs/config';
import { CountryModule } from '../country/country.module';

@Module({
  imports: [ConfigModule, CountryModule],
  controllers: [ParserController],
  providers: [ParserService]
})
export class ParserModule { }
