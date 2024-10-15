import { Module } from '@nestjs/common';
import { HotelsRepository } from './hotels.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotels } from './hotels.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hotels])],
  providers: [HotelsRepository],
  exports: [HotelsRepository]
})
export class HotelsModule {}
