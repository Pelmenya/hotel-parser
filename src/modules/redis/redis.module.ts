import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigModule } from '@nestjs/config';
import { RedisController } from './redis.controller';

@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
  controllers: [RedisController]
})
export class RedisModule {}
