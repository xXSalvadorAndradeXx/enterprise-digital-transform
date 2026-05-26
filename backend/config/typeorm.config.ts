// src/config/typeorm.config.ts
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();  // Carga .env antes que nada

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host:     configService.get('DB_HOST'),
  port:     configService.get<number>('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,    // SIEMPRE false cuando usas migraciones
});