import { Module } from '@nestjs/common';
import { HotelRepository } from './hotel.repository';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature()],
  providers: [HotelRepository],
  exports: [HotelRepository]
})
export class HotelModule {}
