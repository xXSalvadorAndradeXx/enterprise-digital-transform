// src/modules/inventory/inventory.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryDetail } from './entities/inventory-detail.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryDetailRepository } from './repositories/inventory-detail.repository';

import { InventoryReservation } from './entities/inventory-reservation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      InventoryDetail,
      InventoryMovement,
      InventoryReservation,
      Product,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepository, InventoryDetailRepository],
  exports: [
    InventoryService,
    InventoryRepository,
    InventoryDetailRepository,
    TypeOrmModule,
  ],
})
export class InventoryModule {}
