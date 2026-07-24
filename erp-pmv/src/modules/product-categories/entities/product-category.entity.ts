// src/modules/product-categories/entities/product-category.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  DeleteDateColumn, OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('product_categories')
export class ProductCategory {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Bebidas' })
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @ApiPropertyOptional({ example: 'Bebidas frías y calientes' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}