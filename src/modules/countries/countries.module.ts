import { Module } from '@nestjs/common';
import { CountriesRepository } from './countries.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Countries } from './countries.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Countries])],
  providers: [CountriesRepository],
  exports: [CountriesRepository]
})
export class CountryModule {}