import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from './modules/postgres/postgres.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParserModule } from './modules/parser/parser.module';
import { CountryModule } from './modules/country/countries.module';
import { HotelsModule } from './modules/hotel/hotels.module';
import { FilesModule } from './modules/file/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Сделать конфигурацию глобальной (необязательно, но полезно)
    }),
    PostgresModule,
    ParserModule,
    CountryModule,
    HotelsModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
