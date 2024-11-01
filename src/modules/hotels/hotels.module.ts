import { Module } from '@nestjs/common';
import { HotelsRepository } from './hotels.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotels } from './hotels.entity';
import { HotelsController } from './hotels.controller';
import { ParserModule } from '../parser/parser.module';
import { HotelsService } from './hotels.service';
import { FilesModule } from '../files/files.module';
import { DistrictsModule } from '../districts/districts.module';
import { ImagesModule } from '../images/images.module';
import { OpenaiModule } from '../openai/openai.module';
import { AboutsModule } from '../abouts/abouts.module';
import { AmenitiesModule } from '../amenities/amenities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hotels]),
    FilesModule,
    ParserModule,
    DistrictsModule,
    ImagesModule,
    OpenaiModule,
    AboutsModule,
    AmenitiesModule
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
