import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Countries } from 'src/modules/countries/countries.entity';
import { Districts } from 'src/modules/districts/districts.entity';
import { Hotels } from 'src/modules/hotels/hotels.entity';
import { Images } from 'src/modules/images/images.entity';

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
      Countries, 
      Hotels, 
      Districts,
      Images
    ],
    synchronize: true,
  };
};
