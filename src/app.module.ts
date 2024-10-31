import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from './modules/postgres/postgres.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParserModule } from './modules/parser/parser.module';
import { CountriesModule } from './modules/countries/countries.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { FilesModule } from './modules/files/files.module';
import { DistrictsModule } from './modules/districts/districts.module';
import { TransportModule } from './modules/transport/transport.module';
import { ImagesModule } from './modules/images/images.module';
import { AmenitiesModule } from './modules/amenities/amenities.module';
import { GeoModule } from './modules/geo/geo.module';
import { AboutModule } from './modules/about/about.module';
import { OpenaiModule } from './modules/openai/openai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Сделать конфигурацию глобальной (необязательно, но полезно)
    }),
    PostgresModule,
    ParserModule,
    CountriesModule,
    HotelsModule,
    FilesModule,
    DistrictsModule,
    TransportModule,
    ImagesModule,
    AmenitiesModule,
    GeoModule,
    AboutModule,
    OpenaiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
