import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from './modules/postgres/postgres.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParserModule } from './modules/parser/parser.module';
import { CountryModule } from './modules/countries/countries.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { FilesModule } from './modules/files/files.module';
import { DistrictsModule } from './modules/districts/districts.module';
import { CheerioModule } from './modules/cheerio/cheerio.module';
import { PuppeteerModule } from './modules/puppeteer/puppeteer.module';
import { TransportModule } from './modules/transport/transport.module';

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
    DistrictsModule,
    CheerioModule,
    PuppeteerModule,
    TransportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
