// src/modules/purchases/entities/purchase.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { User } from '../../users/entities/user.entity';
import { PurchaseItem } from './purchase-item.entity';
import { PurchaseStatus } from '../enums/purchase-status.enum';

@Entity('purchases')
export class Purchase {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'OC-2026-0001' })
  @Column({ type: 'varchar', length: 50, unique: true })
  reference: string;

  @ApiProperty({ enum: PurchaseStatus, example: PurchaseStatus.DRAFT })
  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.DRAFT,
  })
  status: PurchaseStatus;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({ example: 1250.00 })
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total: number;

  @ApiPropertyOptional()
  @Column({ name: 'ordered_at', type: 'timestamptz', nullable: true })
  orderedAt: Date | null;

  @ApiPropertyOptional()
  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @ApiPropertyOptional()
  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt: Date | null;

  @ApiPropertyOptional()
  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  // Relaciones
  @ManyToOne(() => Supplier, { eager: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedById: string | null;

  @OneToMany(() => PurchaseItem, (item) => item.purchase, {
    cascade: true,
    eager: true,
  })
  items: PurchaseItem[];
}