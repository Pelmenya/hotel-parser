import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class RedisService {
    private client: Redis;

    constructor(
        private readonly configService: ConfigService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {
        this.client = new Redis({
            host: this.configService.get<string>('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT'),
        });
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, expireSeconds?: number): Promise<void> {
        if (expireSeconds !== undefined) {
            await this.client.set(key, value, 'EX', expireSeconds);
        } else {
            await this.client.set(key, value);
        }
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async flushAll(): Promise<void> {
        try {
            await this.client.flushall();
            this.logger.info('Successfully flushed all Redis keys.');
        } catch (error) {
            this.logger.error('Error flushing Redis keys:', error);
        }
    }

    async checkRedisConnection() {
        try {
            const result = await this.client.get('test_key');
            if (!result) {
                await this.client.set('test_key', 'test_value');
            }
            this.logger.info('Redis is working correctly.');
        } catch (error) {
            this.logger.error('Redis is not working:', error);
        }
    }
}
