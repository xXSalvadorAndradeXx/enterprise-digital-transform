import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  cantidad!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioUnitario!: number;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  cart!: Cart;

  @ManyToOne(() => Product, (product) => product.cartItems)
  product!: Product;
}