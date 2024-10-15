import { Module } from '@nestjs/common';
import { CountryRepository } from './ountries.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './countries.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Country])],
  providers: [CountryRepository],
  exports: [CountryRepository]
})
export class CountryModule {}