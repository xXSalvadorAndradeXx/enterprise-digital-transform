// src/modules/purchases/entities/purchase-item.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Purchase } from './purchase.entity';

@Entity('purchase_items')
export class PurchaseItem {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 10 })
  @Column({ type: 'numeric', precision: 12, scale: 4 })
  quantity: number;

  @ApiProperty({ example: 25.50 })
  @Column({ name: 'unit_cost', type: 'numeric', precision: 12, scale: 2 })
  unitCost: number;

  @ApiProperty({ example: 255.00 })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Purchase, (purchase) => purchase.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;
}