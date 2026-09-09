import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Importa ConfigService
import { TypeOrmModule } from '@nestjs/typeorm'; // Importa TypeOrmModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './module/users/users.module';
import { ProductsModule } from './module/products/products.module';
import { CartModule } from './module/cart/cart.module';
import { AuthModule } from './module/auth/auth.module';
import { CategoriesModule } from './module/categories/categories.module';
import { RolesModule } from './module/roles/roles.module';
import { PermissionsModule } from './module/permissions/permissions.module';
import { validate } from './env.validation';
import { SuppliersModule } from './module/suppliers/suppliers.module';
import { InventoryModule } from './module/inventory/inventory.module';
import { PurchasesModule } from './module/purchases/purchases.module';
import { BranchesModule } from './module/branches/branches.module';
import { OrdersModule } from './module/orders/orders.module';
import { PaymentsModule } from './module/payments/payments.module';
import { LocationsModule } from './module/locations/locations.module';
import { CustomersModule } from './module/customers/customers.module';
import { NotificationsModule } from './module/notifications/notifications.module';

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
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true, // Carga automáticamente las entidades de tus módulos
        synchronize: false, // Sincroniza las tablas con tus entidades (solo para desarrollo)
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
    BranchesModule,
    OrdersModule,
    PaymentsModule,
    LocationsModule,
    CustomersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
