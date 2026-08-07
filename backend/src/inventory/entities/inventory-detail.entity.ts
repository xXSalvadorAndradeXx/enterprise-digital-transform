import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Inventory } from './inventory.entity';
import { SupplierPurchaseItem } from '../../purchases/entities/supplier-purchase-item.entity';

@Entity('inventory_details')
@Index(['inventoryId', 'size', 'color'])
@Check('stock_non_negative', 'stock >= 0')
@Check('unit_cost_non_negative', 'unit_cost >= 0')
@Check('min_stock_non_negative', 'min_stock >= 0')
@Check('color_hex_format', "color ~ '^#[0-9a-fA-F]{6}$'")
export class InventoryDetail {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'SKU-SHIRT-M-RED' })
  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  sku!: string;

  @ApiProperty({ example: 'M' })
  @Column({ type: 'varchar', length: 50, nullable: false })
  size!: string;

  @ApiProperty({ example: '#FF0000' })
  @Column({ type: 'varchar', length: 7, nullable: false })
  color!: string;

  @ApiProperty({ example: 100 })
  @Column({ type: 'integer', nullable: false, default: 0 })
  stock!: number;

  @ApiProperty({ example: 15.50 })
  @Column({ name: 'unit_cost', type: 'numeric', precision: 10, scale: 2, nullable: false, default: 0 })
  unitCost!: number;

  @ApiProperty({ example: 10 })
  @Column({ name: 'min_stock', type: 'integer', nullable: false, default: 0 })
  minStock!: number;

  // --- Relaciones ---

  @ApiProperty({ type: () => Inventory })
  @ManyToOne(() => Inventory, (inventory) => inventory.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_id' })
  inventory!: Inventory;

  @Column({ name: 'inventory_id', type: 'uuid' })
  inventoryId!: string;

  @ApiPropertyOptional({ type: () => SupplierPurchaseItem })
  @OneToOne(() => SupplierPurchaseItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'purchase_item_id' })
  purchaseItem!: SupplierPurchaseItem | null;

  @Column({ name: 'purchase_item_id', type: 'uuid', nullable: true })
  purchaseItemId!: string | null;

  // --- Auditoría ---

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
