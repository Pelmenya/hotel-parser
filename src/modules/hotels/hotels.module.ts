import { Module } from '@nestjs/common';
import { HotelsRepository } from './hotels.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotels } from './hotels.entity';
import { HotelsController } from './hotels.controller';
import { ParserModule } from '../parser/parser.module';
import { HotelsService } from './hotels.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hotels]),
    FilesModule,
    ParserModule,
  ],
  providers: [
    HotelsRepository, 
    HotelsService
  ],
  controllers: [HotelsController],
  exports: [
    HotelsRepository, 
    HotelsService
  ],
})
export class HotelsModule { }
