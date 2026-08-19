import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { SupplierPurchase } from './entities/supplier-purchase.entity';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { UsersModule } from '../users/users.module'; 
@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, SupplierPurchase]),
    UsersModule, 
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [TypeOrmModule, SuppliersService],
})
export class SuppliersModule {}
