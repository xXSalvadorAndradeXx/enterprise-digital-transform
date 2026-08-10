// src/purchases/entities/supplier-purchase.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PurchaseStatus } from '../enums/purchase-status.enum';
import { SupplierPurchaseItem } from './supplier-purchase-item.entity';
import { PurchaseStatusHistory } from './purchase-status-history.entity';

@Entity('supplier_purchases')
export class SupplierPurchase {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @ApiProperty({ example: 0.00 })
  @Column({
    name: 'total_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount!: number;

  @ApiProperty({ enum: PurchaseStatus })
  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING,
  })
  status!: PurchaseStatus;

  @ApiPropertyOptional()
  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt!: Date | null;

  @ApiPropertyOptional({ example: 'https://storage.com/facturas/001.pdf' })
  @Column({ name: 'invoice_url', type: 'varchar', length: 500, nullable: true })
  invoiceUrl!: string | null;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => SupplierPurchaseItem, (item) => item.purchase, {
    cascade: true,
    eager: true,
  })
  items!: SupplierPurchaseItem[];

  @OneToMany(() => PurchaseStatusHistory, (h) => h.purchase)
  statusHistory!: PurchaseStatusHistory[];
}