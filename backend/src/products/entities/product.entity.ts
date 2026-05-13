import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price!: number;

  @Column({
    default: 0,
  })
  stock!: number;

  @Column({
    nullable: true,
  })
  imageUrl!: string;

  @Column({
    default: true,
  })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({
    type: 'jsonb',
    default: {},
  })
  metadata!: Record<string, any>;

  // Un producto pertenece a una categoría
  @ManyToOne(() => Category, (category) => category.products, {
    eager: true,
  })
  category!: Category;

  @OneToMany(() => CartItem, (item) => item.product)
  cartItems!: CartItem[];
}