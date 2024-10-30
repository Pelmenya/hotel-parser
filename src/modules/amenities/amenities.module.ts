import { Module } from '@nestjs/common';
import { AmenitiesService } from './amenities.service';

@Module({
  providers: [AmenitiesService]
})
export class AmenitiesModule {}
