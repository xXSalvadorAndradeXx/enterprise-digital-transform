// src/modules/suppliers/entities/supplier.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('suppliers')
export class Supplier {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Distribuidora El Volcán S.A.' })
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @ApiPropertyOptional({ example: '0614-123456-101-1' })
  @Column({ name: 'tax_id', type: 'varchar', length: 20, nullable: true, unique: true })
  taxId: string | null;

  @ApiPropertyOptional({ example: 'contacto@volcan.com' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ example: '+503 2222-3333' })
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ example: 'Calle Principal #10, San Salvador' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @ApiPropertyOptional({ example: 'Carlos Pérez' })
  @Column({ name: 'contact_name', type: 'varchar', length: 100, nullable: true })
  contactName: string | null;

  @ApiPropertyOptional({ example: 'Entrega los martes y jueves.' })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}