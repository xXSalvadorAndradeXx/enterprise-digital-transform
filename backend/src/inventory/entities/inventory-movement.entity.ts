// src/inventory/entities/inventory-movement.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product }         from '../../products/entities/product.entity';
import { User }            from '../../users/entities/user.entity';
import { MovementType }    from '../enums/movement-type.enum';
import { MovementChannel } from '../enums/movement-channel.enum';
import { InventoryDetail } from './inventory-detail.entity';

@Entity('inventory_movements')
export class InventoryMovement {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ enum: MovementType })
  @Column({ type: 'enum', enum: MovementType })
  type!: MovementType;

  @ApiProperty({ example: 10 })
  @Column({ type: 'numeric', precision: 12, scale: 4 })
  quantity!: number;

  @ApiProperty({ example: 90 })
  @Column({ name: 'stock_before', type: 'numeric', precision: 12, scale: 4 })
  stockBefore!: number;

  @ApiProperty({ example: 100 })
  @Column({ name: 'stock_after', type: 'numeric', precision: 12, scale: 4 })
  stockAfter!: number;

  @ApiPropertyOptional({ example: 'Ingreso por compra de producto nuevo' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ example: 'uuid-de-la-compra' })
  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId!: string | null;

  @ApiProperty({ enum: MovementChannel, example: MovementChannel.TIENDA_FISICA })
  @Column({
    type: 'enum',
    enum: MovementChannel,
    enumName: 'inventory_movement_channel_enum',
    nullable: false,
    default: MovementChannel.TIENDA_FISICA,
  })
  channel!: MovementChannel;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── CORREGIDO: product_id ahora es nullable ────────────────────────────────
  // Una compra puede crear inventario físico antes de que exista un producto
  // publicado en el e-commerce. El movimiento se identifica por
  // inventory_detail_id → inventory_details → inventories → product_name.
  @ApiPropertyOptional({ type: () => Product })
  @ManyToOne(() => Product, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product!: Product | null;

  // ── CORREGIDO: era NOT NULL, ahora nullable ───────────────────────────────
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ type: () => User })
  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById!: string | null;

  @ApiPropertyOptional({ type: () => InventoryDetail })
  @ManyToOne(() => InventoryDetail, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'inventory_detail_id' })
  inventoryDetail!: InventoryDetail | null;

  @Column({ name: 'inventory_detail_id', type: 'uuid', nullable: true })
  inventoryDetailId!: string | null;
}