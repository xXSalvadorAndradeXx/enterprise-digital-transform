// src/purchases/purchases.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierPurchase } from './entities/supplier-purchase.entity';
import { SupplierPurchaseItem } from './entities/supplier-purchase-item.entity';
import { PurchaseStatusHistory } from './entities/purchase-status-history.entity';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplierPurchase,
      SupplierPurchaseItem,
      PurchaseStatusHistory,
    ]),
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
