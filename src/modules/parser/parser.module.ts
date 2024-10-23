import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from '../files/files.module';
import { HotelsModule } from '../hotels/hotels.module';
import { DistrictsModule } from '../districts/districts.module';
import { TransportModule } from '../transport/transport.module';

@Module({
  imports: [ConfigModule, TransportModule],
  controllers: [ParserController],
  providers: [ParserService],
  exports: [ParserService]
})
export class ParserModule { }
