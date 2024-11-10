import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppDataSource } from 'data-source';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const instanceId = process.env.INSTANCE_ID || 'default';
  // Создание директории для логов, если она не существует
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
  const logFileName = `error-${instanceId}.log`;
  const logStream = fs.createWriteStream(path.join(logsDir, logFileName), { flags: 'a' });

  process.on('uncaughtException', (err) => {
    const errorMessage = `[${new Date().toISOString()}] Uncaught Exception: ${err.stack}\n`;
    console.error(errorMessage);
    logStream.write(errorMessage);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    const errorMessage = `[${new Date().toISOString()}] Unhandled Rejection at: ${promise}, reason: ${reason instanceof Error ? reason.stack : reason}\n`;
    console.error(errorMessage);
    logStream.write(errorMessage);
  });

  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');
  } catch (err) {
    const errorMessage = `[${new Date().toISOString()}] Error during Data Source initialization: ${err.stack || err}\n`;
    console.error(errorMessage);
    logStream.write(errorMessage);
  }

  try {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
    console.log(`Application is running on: http://localhost:3000 (Instance: ${instanceId})`);
  } catch (err) {
    const errorMessage = `[${new Date().toISOString()}] Error during application bootstrap: ${err.stack || err}\n`;
    console.error(errorMessage);
    logStream.write(errorMessage);
  }
}

bootstrap();
