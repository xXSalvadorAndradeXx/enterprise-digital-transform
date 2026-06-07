// src/cart/entities/cart-item.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'int',
    default: 1,
  })
  quantity!: number;

  // Precio unitario en el momento de agregar al carrito
  // (no cambia aunque cambie el producto)
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  unitPrice!: number;

  // Subtotal persistido en base de datos
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  subtotal!: number;

  // =========================
  // RELACIÓN CON CART
  // =========================
  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;

  // =========================
  // RELACIÓN CON PRODUCT
  // =========================
  @ManyToOne(() => Product, (product) => product.cartItems, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  // =========================
  // AUTOMATIZACIÓN DEL SUBTOTAL
  // =========================
  @BeforeInsert()
  @BeforeUpdate()
  calculateSubtotal() {
    this.subtotal =
      Number(this.unitPrice) * Number(this.quantity);
  }
}