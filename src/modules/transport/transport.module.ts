import { Module } from '@nestjs/common';
import { TransportService } from './transport.service';

@Module({
  providers: [TransportService]
})
export class TransportModule {}
