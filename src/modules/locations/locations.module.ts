import { Module } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Locations } from './locations.entity';
import { LocationsController } from './locations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Locations])
  ],
  providers: [LocationsRepository],
  exports: [LocationsRepository],
  controllers: [LocationsController]
})
export class LocationsModule {}
