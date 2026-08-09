import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../../products/entities/product.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Category } from '../../categories/entities/category.entity';
import { SupplierPurchase } from '../../purchases/entities/supplier-purchase.entity';
import { InventoryDetail } from './inventory-detail.entity';
import { InventoryStatus } from '../enums/inventory-status.enum';

@Entity('inventories')
export class Inventory {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'Audífonos Inalámbricos' })
  @Column({
    name: 'product_name',
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  productName!: string;

  @ApiProperty({ example: 'Sony' })
  @Column({ type: 'varchar', length: 100, nullable: false })
  brand!: string;

  @ApiPropertyOptional({ example: 'https://images.com/audifonos.jpg' })
  @Column({
    name: 'main_image_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  mainImageUrl!: string | null;

  @ApiProperty({ enum: InventoryStatus, default: InventoryStatus.ACTIVE })
  @Index()
  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.ACTIVE,
  })
  status!: InventoryStatus;

  // --- Relaciones ---

  @ApiProperty({ type: () => Supplier })
  @ManyToOne(() => Supplier, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier | null;

  @Index()
  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId!: string | null;

  @ApiProperty({ type: () => Category })
  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Index()
  @Column({ name: 'category_id', type: 'integer', nullable: true })
  categoryId!: number | null;

  @ApiPropertyOptional({ type: () => SupplierPurchase })
  @OneToOne(() => SupplierPurchase, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'purchase_id' })
  purchase!: SupplierPurchase | null;

  @Column({ name: 'purchase_id', type: 'uuid', nullable: true })
  purchaseId!: string | null;

  @OneToMany(() => InventoryDetail, (detail) => detail.inventory, {
    cascade: ['remove'],
  })
  details!: InventoryDetail[];

  // --- Columnas de auditoría ---

  @ApiProperty()
  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  // --- Compatibilidad con lógica de stock existente ---

  @ApiProperty({ example: 100.0 })
  @Column({ type: 'numeric', precision: 12, scale: 4, default: 0 })
  stock!: number;

  @ApiProperty({ example: 10.0 })
  @Column({ type: 'numeric', precision: 12, scale: 4, default: 0 })
  reserved!: number;

  get available(): number {
    return Number(this.stock) - Number(this.reserved);
  }

  @ApiProperty({ type: () => Product })
  @OneToOne(() => Product, { eager: true, nullable: true })
  @JoinColumn({ name: 'product_id' })
  product!: Product | null;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ example: 100 })
  totalStock?: number;

  @ApiPropertyOptional({ example: 5 })
  totalVariants?: number;
}
