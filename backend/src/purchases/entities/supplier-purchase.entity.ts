// src/purchases/entities/supplier-purchase.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  OneToMany, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PurchaseStatus } from '../enums/purchase-status.enum';
import { PurchaseType }   from '../enums/purchase-type.enum';
import { ProductGender }  from '../enums/product-gender.enum';
import { SupplierPurchaseItem }   from './supplier-purchase-item.entity';
import { PurchaseStatusHistory }  from './purchase-status-history.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { User }     from '../../users/entities/user.entity';

@Entity('supplier_purchases')
export class SupplierPurchase {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ── CAMPO AÑADIDO: referencia legible única (CP-0001, CP-0002…) ──────────
  @ApiProperty({ example: 'CP-0007' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  reference!: string | null;

  // ── CAMPO AÑADIDO: fecha de la compra (diferente a createdAt) ────────────
  @ApiProperty({ example: '2026-08-16' })
  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate!: string | null;

  // ── CAMPO AÑADIDO: marca del producto ────────────────────────────────────
  @ApiProperty({ example: 'Nike' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  brand!: string | null;

  // ── CAMPO AÑADIDO: categoría (integer, no UUID) ──────────────────────────
  @ApiPropertyOptional({ example: 1 })
  @Index()
  @Column({ name: 'category_id', type: 'integer', nullable: true })
  categoryId!: number | null;

  // ── CAMPO AÑADIDO: género del producto ───────────────────────────────────
  @ApiPropertyOptional({ enum: ProductGender, nullable: true })
  @Column({
    type: 'enum',
    enum: ProductGender,
    enumName: 'product_gender_enum',
    nullable: true,
  })
  gender!: ProductGender | null;

  /** RN-001: tipo inmutable desde la creación */
  @ApiProperty({ enum: PurchaseType })
  @Column({ type: 'varchar', length: 20 })
  type!: PurchaseType;

  /** Denormalizado para historial (RN-002/003) */
  @ApiProperty()
  @Column({ name: 'product_name', type: 'varchar', length: 200 })
  productName!: string;

  /** Calculado en Service — RN-027 */
  @ApiProperty()
  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalAmount!: number;

  @ApiProperty()
  @Column({ name: 'total_quantity', type: 'integer', default: 0 })
  totalQuantity!: number;

  /** RN-022 */
  @ApiPropertyOptional()
  @Column({ name: 'invoice_url', type: 'varchar', length: 500, nullable: true })
  invoiceUrl!: string | null;

  /** PMV: siempre COMPLETED (RN-017) */
  @ApiProperty({ enum: PurchaseStatus })
  @Column({ type: 'varchar', length: 20, default: PurchaseStatus.COMPLETED })
  status!: PurchaseStatus;

  /** Referencia al inventario generado (RN-015) */
  @ApiPropertyOptional({ format: 'uuid' })
  @Column({ name: 'inventory_id', type: 'uuid', nullable: true })
  inventoryId!: string | null;

  // ── RELACIÓN: proveedor completo (para devolver name en la respuesta) ────
  @ApiPropertyOptional({ type: () => Supplier })
  @ManyToOne(() => Supplier, { onDelete: 'SET NULL', nullable: true, eager: false })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier | null;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId!: string;

  // ── RELACIÓN: usuario creador (para devolver firstName/lastName) ─────────
  @ApiPropertyOptional({ type: () => User })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  createdByUser!: User | null;

  /** RN-028 */
  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  /** RN-020: soft delete */
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