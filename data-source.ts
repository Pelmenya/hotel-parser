import { TranslationDictionary } from 'src/modules/translation/translation-dictionary.entity';
import { Countries } from './src/modules/countries/countries.entity';
import { Districts } from './src/modules/districts/districts.entity';
import { Hotels } from './src/modules/hotels/hotels.entity';
import { DataSource } from 'typeorm';
import { Abouts } from 'src/modules/abouts/abouts.entity';
import { Amenities } from 'src/modules/amenities/amenities.entity';
import { GeoData } from 'src/modules/geo/geo-data.entity';
import { Policies } from 'src/modules/policies/policies.entity';
import { Images } from 'src/modules/images/images.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    TranslationDictionary,
    Countries, 
    Hotels, 
    Districts,
    Images,
    Abouts,
    Amenities,
    GeoData,
    Policies
  ],  // Укажите ваши сущности здесь
  migrations: ['app/src/migrations/*{.ts,.js}'],
  synchronize: true,
});