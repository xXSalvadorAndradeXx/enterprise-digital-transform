import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity({ name: 'order_items' })
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order!: Order;

  @ManyToOne(() => Product, { eager: true })
  product!: Product;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: number; // Representa el precio efectivo utilizado para calcular el ítem (effectivePrice)

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'sale_price_snapshot',
    nullable: false,
    default: 0,
  })
  salePriceSnapshot!: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    name: 'discount_snapshot',
    nullable: true,
    default: 0,
  })
  discountSnapshot?: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    name: 'subtotal',
    nullable: false,
    default: 0,
  })
  subtotal!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

