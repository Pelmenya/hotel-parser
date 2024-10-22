import { Module } from '@nestjs/common';
import { DistrictsRepository } from './districts.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Districts } from './districts.entity';
import { DistrictsController } from './districts.controller';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Districts]),
  ],
  providers: [DistrictsRepository],
  exports:[DistrictsRepository],
  controllers: [DistrictsController],
})
export class DistrictsModule {}
