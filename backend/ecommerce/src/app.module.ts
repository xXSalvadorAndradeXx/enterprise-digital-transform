import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Importa ConfigService
import { TypeOrmModule } from '@nestjs/typeorm'; // Importa TypeOrmModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { RolesModule } from './roles/roles.module';
import { validate } from './env.validation';


@Module({
  imports: [
    // Configuración de Variables de Entorno
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),

    // Configuración de Conexión a PostgreSQL (T-03)
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST',),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true, // Carga automáticamente las entidades de tus módulos
        synchronize: true,      // Sincroniza las tablas con tus entidades (solo para desarrollo)
      }),
    }),

    // Tus Módulos
    UsersModule,
    ProductsModule,
    CartModule,
    AuthModule,
    CategoriesModule,
    RolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}