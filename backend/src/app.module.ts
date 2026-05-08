// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }),

  TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      type: 'postgres',
      host: config.get('DB_HOST'),
      port: config.get<number>('DB_PORT'),
      username: config.get('DB_USERNAME'),
      password: config.get('DB_PASSWORD'),
      database: config.get('DB_DATABASE'),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: config.get('NODE_ENV') === 'development',
      logging: config.get('NODE_ENV') === 'development',
    }),
  }),

  ProductsModule,
  CartModule,
  UsersModule,
  AuthModule,
],
  controllers: [AppController],  // ← esto es clave
  providers: [AppService],
})
export class AppModule {}
