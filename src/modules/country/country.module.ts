import { Module } from '@nestjs/common';
import { CountryRepository } from './country.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './country.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Country])],
  providers: [CountryRepository],
  exports: [CountryRepository]
})
export class CountryModule {}