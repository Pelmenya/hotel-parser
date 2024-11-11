import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppDataSource } from 'data-source';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';

async function bootstrap() {
  const instanceId = process.env.INSTANCE_ID || 'default';
  // Создание директории для логов, если она не существует
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.colorize(), // Добавляем цвет
      winston.format.label({ label: `Instance: ${instanceId}` }),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, label }) => {
        return `[${timestamp}] [${label}] ${level}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.File({ filename: `${logsDir}/error-${instanceId}.log`, level: 'error' }),
      new winston.transports.Console()
    ],
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.stack}`);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason instanceof Error ? reason.stack : reason}`);
  });

  try {
    await AppDataSource.initialize();
    logger.info('Data Source has been initialized!');
  } catch (err) {
    logger.error(`Error during Data Source initialization: ${err.stack || err}`);
  }

  try {
    const app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger({
        instance: logger,
      }),
    });
    await app.listen(3000);
    logger.info(`Application is running on: http://localhost:3000 (Instance: ${instanceId})`);
  } catch (err) {
    logger.error(`Error during application bootstrap: ${err.stack || err}`);
  }
}

bootstrap();
