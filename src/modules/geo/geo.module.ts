import { Module } from '@nestjs/common';
import { GeoService } from './geo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeoData } from './geo-data.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeoData])
  ],
  providers: [GeoService],
  exports: [GeoService]
})
export class GeoModule {}
