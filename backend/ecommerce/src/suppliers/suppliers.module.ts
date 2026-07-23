import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { SupplierPurchase } from './entities/supplier-purchase.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, SupplierPurchase])],
  exports: [TypeOrmModule],
})
export class SuppliersModule {}
