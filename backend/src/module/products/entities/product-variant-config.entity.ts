import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { InventoryDetail } from '../../inventory/entities/inventory-detail.entity';

@Entity('product_variant_configs')
export class ProductVariantConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.variantConfigs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'inventory_detail_id', type: 'uuid', nullable: false })
  inventoryDetailId!: string;

  @ManyToOne(() => InventoryDetail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inventory_detail_id' })
  inventoryDetail!: InventoryDetail;

  @Column({ name: 'min_stock', type: 'integer', default: 0, nullable: false })
  minStock!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
