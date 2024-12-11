import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Post('flush')
  @HttpCode(HttpStatus.NO_CONTENT)
  async flushAllCache(): Promise<void> {
    await this.redisService.flushAll();
  }
}
