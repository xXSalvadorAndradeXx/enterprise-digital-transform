// src/modules/purchases/purchases.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { InventoryModule } from '../inventory/inventory.module';  // ← agregar

@Module({
  imports: [
    TypeOrmModule.forFeature([Purchase, PurchaseItem]),
    InventoryModule,  // ← agregar
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}