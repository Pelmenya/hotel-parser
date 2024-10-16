import { Module } from '@nestjs/common';
import { DistrictsRepository } from './districts.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Districts } from './districts.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Districts])],
  providers: [DistrictsRepository],
  exports:[DistrictsRepository],
})
export class DistrictsModule {}
