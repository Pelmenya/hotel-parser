import { Module } from '@nestjs/common';
import { HotelsRepository } from './hotels.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotels } from './hotels.entity';
import { HotelsController } from './hotels.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hotels])],
  providers: [HotelsRepository],
  exports: [HotelsRepository],
  controllers: [HotelsController]
})
export class HotelsModule {}
