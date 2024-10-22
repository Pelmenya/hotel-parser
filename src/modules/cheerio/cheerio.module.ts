import { Module } from '@nestjs/common';
import { CheerioService } from './cheerio.service';

@Module({
  providers: [CheerioService]
})
export class CheerioModule {}
