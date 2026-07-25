// src/modules/inventory/entities/inventory.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../products/entities/product.entity';

@Entity('inventory')
export class Inventory {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 100.00 })
  @Column({ type: 'numeric', precision: 12, scale: 4, default: 0 })
  stock: number;

  @ApiProperty({ example: 10.00 })
  @Column({ type: 'numeric', precision: 12, scale: 4, default: 0 })
  reserved: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // stock disponible = stock - reserved
  get available(): number {
    return Number(this.stock) - Number(this.reserved);
  }

  @ApiProperty({ type: () => Product })
  @OneToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;
}