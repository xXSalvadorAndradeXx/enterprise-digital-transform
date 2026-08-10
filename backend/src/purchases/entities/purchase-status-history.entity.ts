// src/purchases/entities/purchase-status-history.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupplierPurchase } from './supplier-purchase.entity';

// Tabla append-only — sin updated_at ni deleted_at
@Entity('purchase_status_history')
export class PurchaseStatusHistory {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId!: string;

  @ApiPropertyOptional({ example: 'PENDING' })
  @Column({ name: 'from_status', type: 'varchar', length: 20, nullable: true })
  fromStatus!: string | null;

  @ApiProperty({ example: 'RECEIVED' })
  @Column({ name: 'to_status', type: 'varchar', length: 20 })
  toStatus!: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => SupplierPurchase, (p) => p.statusHistory)
  @JoinColumn({ name: 'purchase_id' })
  purchase!: SupplierPurchase;
}