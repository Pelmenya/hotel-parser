import { Module } from '@nestjs/common';
import { CountriesRepository } from './countries.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Countries } from './countries.entity';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [TypeOrmModule.forFeature([Countries]), ParserModule],
  providers: [CountriesRepository, CountriesService],
  exports: [CountriesRepository, CountriesService],
  controllers: [CountriesController]
})
export class CountriesModule {}