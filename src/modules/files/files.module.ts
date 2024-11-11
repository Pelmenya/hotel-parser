import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { TransportModule } from '../transport/transport.module';

@Module({
  imports: [
    TransportModule, 
  ],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
