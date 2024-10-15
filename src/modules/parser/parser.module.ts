import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { ConfigModule } from '@nestjs/config';
import { CountryModule } from '../countries/countries.module';
import { FilesModule } from '../files/files.module';
import { HotelsModule } from '../hotels/hotels.module';

@Module({
  imports: [ConfigModule, CountryModule, HotelsModule, FilesModule],
  controllers: [ParserController],
  providers: [ParserService]
})
export class ParserModule { }
