// src/module/customers/customers.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { EcommerceAuthSession } from './entities/ecommerce-auth-session.entity';
import { CustomerFavorite } from './entities/customer-favorite.entity';
import { Product } from '../products/entities/product.entity';

import { CustomersService } from './customers.service';
import { CustomerFavoritesService } from './customer-favorites.service';
import { LocationsModule } from '../locations/locations.module';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { EcommerceAuthController } from './controllers/ecommerce-auth.controller';
import { CustomersController } from './controllers/customers.controller';
import { CustomersAdminController } from './controllers/customers-admin.controller';
import { CustomerFavoritesController } from './controllers/customer-favorites.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerAddress,
      EcommerceAuthSession,
      CustomerFavorite,
      Product,
    ]),
    LocationsModule,
    AuthModule,
    UsersModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [
    EcommerceAuthController,
    CustomersController,
    CustomersAdminController,
    CustomerFavoritesController,
  ],
  providers: [CustomersService, CustomerFavoritesService, CustomerJwtStrategy],
  exports: [
    TypeOrmModule,
    CustomersService,
    CustomerFavoritesService,
    CustomerJwtStrategy,
  ],
})
export class CustomersModule {}
