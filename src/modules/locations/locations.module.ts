import { forwardRef, Module } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Locations } from './locations.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { TranslationModule } from '../translation/translation.module';
import { HotelsModule } from '../hotels/hotels.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Locations]),
    TranslationModule,
    SettingsModule,
  ],
  providers: [LocationsRepository, LocationsService],
  exports: [LocationsRepository, LocationsService],
  controllers: [LocationsController]
})
export class LocationsModule {}
