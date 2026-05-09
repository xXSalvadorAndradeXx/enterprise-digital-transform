import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, CreateDateColumn
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  // decimal: para dinero. precision=10 dígitos, scale=2 decimales
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

  @Column({ default: 0 })
  stock!: number;

  @Column({ nullable: true })
  imageUrl!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  // Un producto pertenece a UNA categoría
  // eager:true carga la categoría automáticamente
  @ManyToOne(() => Category, (cat) => cat.products, { eager: true })
  category!: Category;

  @OneToMany(() => CartItem, (item) => item.product)
  cartItems!: CartItem[];
}