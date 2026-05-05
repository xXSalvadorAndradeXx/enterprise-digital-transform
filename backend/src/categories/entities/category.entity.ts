import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })  // nullable: el campo es opcional
  description!: string;

  // Una categoría puede tener MUCHOS productos
  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}