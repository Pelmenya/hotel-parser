import { Module } from '@nestjs/common';
import { AboutsService } from './abouts.service';

@Module({
  providers: [AboutsService]
})
export class AboutsModule {}
