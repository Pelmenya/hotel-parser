import { Module } from '@nestjs/common';
import { GeoService } from './geo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeoData } from './geo-data.entity';
import { GeoDataRepository } from './geo-data.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeoData])
  ],
  providers: [GeoService, GeoDataRepository],
  exports: [GeoService, GeoDataRepository]
})
export class GeoModule {}
