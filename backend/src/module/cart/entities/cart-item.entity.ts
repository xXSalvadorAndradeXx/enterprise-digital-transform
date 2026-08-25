import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
  Unique,
  Index,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariantConfig } from '../../products/entities/product-variant-config.entity';

@Entity('cart_items')
@Check('CHK_cart_item_quantity_positive', 'quantity > 0')
@Unique('UQ_cart_item_cart_variant', ['cartId', 'variantId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'cart_id', type: 'uuid', nullable: false })
  cartId!: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;

  @Index()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Index()
  @Column({ name: 'variant_id', type: 'uuid', nullable: false })
  variantId!: string;

  @ManyToOne(() => ProductVariantConfig, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variantConfig!: ProductVariantConfig;

  @Column({ type: 'integer', nullable: false })
  quantity!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  get unitPrice(): number {
    if (this.product?.salePrice) {
      return Number(this.product.salePrice);
    }
    return 0;
  }
}