// src/modules/inventory/entities/inventory-movement.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { MovementType } from '../enums/movement-type.enum';

@Entity('inventory_movements')
export class InventoryMovement {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: MovementType })
  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @ApiProperty({ example: 10 })
  @Column({ type: 'numeric', precision: 12, scale: 4 })
  quantity: number;

  @ApiProperty({ example: 90 })
  @Column({ name: 'stock_before', type: 'numeric', precision: 12, scale: 4 })
  stockBefore: number;

  @ApiProperty({ example: 100 })
  @Column({ name: 'stock_after', type: 'numeric', precision: 12, scale: 4 })
  stockAfter: number;

  @ApiPropertyOptional({ example: 'Ajuste por conteo físico' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  @ApiPropertyOptional({ example: 'uuid-de-la-compra' })
  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;
}