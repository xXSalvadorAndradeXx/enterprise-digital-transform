import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 'activo' }) // activo, comprado, cancelado
  estado!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.carts)
  user!: User;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
  items!: CartItem[];
}