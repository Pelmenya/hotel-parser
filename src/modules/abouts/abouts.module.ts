import { Module } from '@nestjs/common';
import { AboutsService } from './abouts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Abouts } from './abouts.entity';
import { AboutsRepository } from './abouts.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Abouts]),
  ],
  providers: [AboutsService, AboutsRepository],
  exports: [AboutsService, AboutsRepository],
})
export class AboutsModule { }
