import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { User } from '../../users/entities/user.entity';
import { ProductImage } from './product-image.entity';
import { ProductTag } from './product-tag.entity';
import { ProductVariantConfig } from './product-variant-config.entity';
import { CustomerFavorite } from '../../customers/entities/customer-favorite.entity';
import { ProductStatus } from '../enums/product-status.enum';

@Entity('products')
@Index(['status'])
@Index(['isPublished'])
@Index(['salePrice'])
@Index(['createdAt'])
@Index(['discountStartsAt'])
@Index(['discountEndsAt'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'inventory_id', type: 'uuid', unique: true, nullable: true })
  inventoryId!: string | null;

  @OneToOne(() => Inventory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'inventory_id' })
  inventory!: Inventory | null;

  @Column({
    name: 'commercial_name',
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  commercialName!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'sale_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  salePrice!: number;

  @Column({
    name: 'discount',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 0,
  })
  discount!: number | null;

  @Column({ name: 'discount_ends_at', type: 'timestamptz', nullable: true })
  discountEndsAt!: Date | null;

  @Column({ name: 'discount_starts_at', type: 'timestamptz', nullable: true })
  discountStartsAt!: Date | null;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
    nullable: false,
  })
  status!: ProductStatus;

  @Column({ name: 'is_published', type: 'boolean', default: false, nullable: false })
  isPublished!: boolean;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by' })
  updatedBy!: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

   get isActive(): boolean {
    return this.status === ProductStatus.ACTIVE;
  }

  get productId(): string {
    return this.id;
  }

  // --- Relaciones OneToMany ---

  @OneToMany(() => ProductImage, (image) => image.product)
  images!: ProductImage[];

  @OneToMany(() => ProductTag, (tag) => tag.product)
  tags!: ProductTag[];

  @OneToMany(() => ProductVariantConfig, (config) => config.product)
  variantConfigs!: ProductVariantConfig[];

  @OneToMany(() => CustomerFavorite, (favorite) => favorite.product)
  favorites!: CustomerFavorite[];
}
