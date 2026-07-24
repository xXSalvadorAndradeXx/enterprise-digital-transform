import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'erp_user',
    password: process.env.DB_PASSWORD || 'erp_password',
    database: process.env.DB_DATABASE || 'erp_pmv',
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
    synchronize: process.env.NODE_ENV === 'development',
    migrationsRun: true,      // ← esto es todo lo que se agrega
    logging: process.env.DB_LOGGING === 'true',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  }),
);