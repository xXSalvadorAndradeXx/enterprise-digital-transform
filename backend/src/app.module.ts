import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      // inject: permite usar ConfigService dentro de useFactory
      inject: [ConfigService],
      
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get('DB_HOST'),
        port:     config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        
        // entities: archivos que definen las tablas
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        
        // synchronize: TypeORM crea/altera tablas automáticamente
        // SOLO en desarrollo. En producción usar migrations
        synchronize: config.get('NODE_ENV') === 'development',
        
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class AppModule {}
