// src/purchases/entities/supplier-purchase-item.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SupplierPurchase } from './supplier-purchase.entity';

@Entity('supplier_purchase_items')
export class SupplierPurchaseItem {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ApiProperty({ example: 10.00 })
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  quantity!: number;

  @ApiProperty({ example: 25.50 })
  @Column({ name: 'unit_cost', type: 'numeric', precision: 10, scale: 2 })
  unitCost!: number;

  @ApiProperty({ example: 255.00 })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal!: number;

  @ManyToOne(() => SupplierPurchase, (p) => p.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase!: SupplierPurchase;
}