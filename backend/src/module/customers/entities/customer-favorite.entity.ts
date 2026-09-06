import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('customer_favorites')
@Unique('UQ_customer_favorite_customer_product', ['customerId', 'productId'])
@Index('IDX_customer_favorite_customer_id', ['customerId'])
export class CustomerFavorite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.favorites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.favorites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
