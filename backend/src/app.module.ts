import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Importa ConfigService
import { TypeOrmModule } from '@nestjs/typeorm'; // Importa TypeOrmModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from '../src/module/users/users.module';
import { ProductsModule } from '../src/module/products/products.module';
import { CartModule } from '../src/module/cart/cart.module';
import { AuthModule } from '../src/module/auth/auth.module';
import { CategoriesModule } from '../src/module/categories/categories.module';
import { RolesModule } from '../src/module/roles/roles.module';
import { PermissionsModule } from '../src/module/permissions/permissions.module';
import { validate } from './env.validation';
import { SuppliersModule } from '../src/module/suppliers/suppliers.module';
import { InventoryModule } from '../src/module/inventory/inventory.module';
import { PurchasesModule } from '../src/module/purchases/purchases.module';
import { OrdersModule } from '../src/module/orders/orders.module';
import { BranchesModule } from '../src/module/branches/branches.module';

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
    PermissionsModule,
    SuppliersModule,
    InventoryModule,
    PurchasesModule,
    OrdersModule,
    BranchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }