import { Module } from '@nestjs/common';
import { ImagesRepository } from './images.repository';
import { ImagesService } from './images.service';
import { FilesModule } from '../files/files.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Images } from './images.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Images]), 
    FilesModule
  ],
  providers: [ImagesRepository, ImagesService],
  exports: [ImagesRepository, ImagesService]
})
export class ImagesModule { }
