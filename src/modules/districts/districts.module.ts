import { Module } from '@nestjs/common';
import { DistrictsRepository } from './districts.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Districts } from './districts.entity';
import { DistrictsController } from './districts.controller';
import { ParserModule } from '../parser/parser.module';
import { DistrictsService } from './districts.service';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Districts]),
    FilesModule,
    ParserModule,
  ],
  providers: [
    DistrictsRepository, 
    DistrictsService
  ],
  exports:[
    DistrictsRepository, 
    DistrictsService
  ],
  controllers: [DistrictsController],
})
export class DistrictsModule {}
