import { Countries } from './src/modules/countries/countries.entity';
import { Districts } from './src/modules/districts/districts.entity';
import { Hotels } from './src/modules/hotels/hotels.entity';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [Hotels, Districts, Countries],  // Укажите ваши сущности здесь
  migrations: ['app/src/migrations/*{.ts,.js}'],
  synchronize: false,
});

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });