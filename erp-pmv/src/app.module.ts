import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import throttlerConfig from './config/throttler.config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { ProductCategoriesModule } from './modules/product-categories/product-categories.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';


@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, throttlerConfig],
      envFilePath: ['.env'],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        configService.get<TypeOrmModuleOptions>('database') as TypeOrmModuleOptions,
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttler.ttl') as number,
          limit: configService.get<number>('throttler.limit') as number,
        },
      ],
    }),

    PermissionsModule,

    UsersModule,

    AuthModule,
   
    RolesModule,
   
    SuppliersModule,
   
    PurchasesModule,
   
    ProductCategoriesModule,
   
    ProductsModule,
   
    InventoryModule,
    // SuppliersModule,
    // PurchasesModule,
    // ProductsModule,
    // ProductCategoriesModule,
    // InventoryModule,
    // CustomersModule,
  ],
})
export class AppModule {}