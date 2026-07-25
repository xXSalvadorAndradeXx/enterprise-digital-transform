import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Supplier } from './supplier.entity';

export enum PurchaseStatus {
  PENDING = 'PENDIENTE',
  RECEIVED = 'RECIBIDA',
  CANCELLED = 'CANCELADA',
}

@Entity('supplier_purchases')
export class SupplierPurchase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  @Column({ type: 'varchar', length: 50, default: PurchaseStatus.PENDING })
  status!: string;

  @ManyToOne(() => Supplier, (supplier) => supplier.supplierPurchases, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
