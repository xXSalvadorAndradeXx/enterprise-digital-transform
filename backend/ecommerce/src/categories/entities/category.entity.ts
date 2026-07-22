import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}