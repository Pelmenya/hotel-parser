import { Module } from '@nestjs/common';
import { AboutService } from './about.service';

@Module({
  providers: [AboutService]
})
export class AboutModule {}
