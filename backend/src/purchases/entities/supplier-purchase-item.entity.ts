// src/purchases/entities/supplier-purchase-item.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupplierPurchase } from './supplier-purchase.entity';

@Entity('supplier_purchase_items')
export class SupplierPurchaseItem {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId!: string;

  /** RN-005: SKU global único e inmutable */
  @ApiProperty({ example: 'CAM-20260801-001' })
  @Column({ type: 'varchar', length: 100 })
  sku!: string;

  /** RN-004 */
  @ApiProperty({ example: 'L' })
  @Column({ type: 'varchar', length: 50 })
  size!: string;

  /** RN-004: formato #RRGGBB */
  @ApiProperty({ example: '#FFFFFF' })
  @Column({ type: 'varchar', length: 7 })
  color!: string;

  /** RN-008: entero positivo */
  @ApiProperty({ example: 10 })
  @Column({ type: 'integer' })
  quantity!: number;

  /** RN-009: >= 0 */
  @ApiProperty({ example: 25.50 })
  @Column({ name: 'unit_cost', type: 'numeric', precision: 10, scale: 2 })
  unitCost!: number;

  /** Calculado en Service */
  @ApiProperty({ example: 255.00 })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal!: number;

  /** FK al detalle de inventario generado (se establece post-transacción) */
  @ApiPropertyOptional({ format: 'uuid' })
  @Column({ name: 'inventory_detail_id', type: 'uuid', nullable: true })
  inventoryDetailId!: string | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => SupplierPurchase, (p) => p.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase!: SupplierPurchase;
}