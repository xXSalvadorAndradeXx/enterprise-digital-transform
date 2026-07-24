// src/modules/products/entities/product.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory } from '../../product-categories/entities/product-category.entity';
import { ProductUnit } from '../enums/product-unit.enum';

@Entity('products')
export class Product {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'PROD-001' })
  @Column({ type: 'varchar', length: 60, unique: true })
  sku: string;

  @ApiProperty({ example: 'Café molido 250g' })
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ enum: ProductUnit, example: ProductUnit.UNIT })
  @Column({
    type: 'enum',
    enum: ProductUnit,
    default: ProductUnit.UNIT,
  })
  unit: ProductUnit;

  @ApiProperty({ example: 12.50 })
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  cost: number;

  @ApiProperty({ example: 18.99 })
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  price: number;

  @ApiProperty({ example: 5 })
  @Column({ name: 'min_stock', type: 'numeric', precision: 12, scale: 4, default: 0 })
  minStock: number;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @ApiPropertyOptional({ type: () => ProductCategory })
  @ManyToOne(() => ProductCategory, { eager: true, nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;
}