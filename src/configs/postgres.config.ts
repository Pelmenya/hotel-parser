import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Abouts } from 'src/modules/abouts/abouts.entity';
import { Amenities } from 'src/modules/amenities/amenities.entity';
import { Countries } from 'src/modules/countries/countries.entity';
import { Districts } from 'src/modules/districts/districts.entity';
import { GeoData } from 'src/modules/geo/geo-data.entity';
import { Hotels } from 'src/modules/hotels/hotels.entity';
import { Images } from 'src/modules/images/images.entity';
import { Locations } from 'src/modules/locations/locations.entity';
import { Policies } from 'src/modules/policies/policies.entity';
import { Settings } from 'src/modules/settings/settings.entity';
import { TranslationDictionary } from 'src/modules/translation/translation-dictionary.entity';

export const getPostgresConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'postgres',
    host: configService.get('POSTGRES_HOST'),
    port: configService.get('POSTGRES_PORT'),
    username: configService.get('POSTGRES_USER'),
    password: configService.get('POSTGRES_PASSWORD'),
    database: configService.get('POSTGRES_DB'),
    entities: [
      TranslationDictionary,
      Countries, 
      Hotels, 
      Districts,
      Images,
      Abouts,
      Amenities,
      GeoData,
      Policies,
      Settings,
      Locations
    ],
    synchronize: true,
  };
};
