// src/module/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { EcommerceAuthSession } from './entities/ecommerce-auth-session.entity';
import { Order } from '../orders/entities/order.entity';

import { CustomersService } from './customers.service';
import { LocationsModule } from '../locations/locations.module';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { EcommerceAuthController } from './controllers/ecommerce-auth.controller';
import { CustomersController } from './controllers/customers.controller';
import { CustomersAdminController } from './controllers/customers-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerAddress, EcommerceAuthSession, Order]),
    LocationsModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [EcommerceAuthController, CustomersController, CustomersAdminController],
  providers: [CustomersService, CustomerJwtStrategy],
  exports: [TypeOrmModule, CustomersService, CustomerJwtStrategy],
})
export class CustomersModule {}
