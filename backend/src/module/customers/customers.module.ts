// src/module/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { EcommerceAuthSession } from './entities/ecommerce-auth-session.entity';

import { CustomersService } from './customers.service';
import { LocationsModule } from '../locations/locations.module';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerAddress, EcommerceAuthSession]),
    LocationsModule,
    AuthModule,
  ],
  providers: [CustomersService, CustomerJwtStrategy],
  exports: [TypeOrmModule, CustomersService, CustomerJwtStrategy],
})
export class CustomersModule {}
