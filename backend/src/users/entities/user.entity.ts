import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToOne, OneToMany, BeforeInsert
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Cart } from '../../cart/entities/cart.entity';

@Entity('users')  // ← nombre de la tabla en PostgreSQL
export class User {

  @PrimaryGeneratedColumn('uuid')  // ID único generado automáticamente
  id!: string;

  

  @Column({ unique: true })          // unique: no puede haber dos iguales
  email!: string;

  @Column()
  name!: string;

  @Column({ select: false })         // select:false = nunca devuelve el password
  password!: string;

  @Column({ default: 'user' })       // rol por defecto
  role!: string;

  @Column({ default: true })
  isActive!: boolean;


  // TypeORM lo rellena solo al crear el registro
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relación: un User tiene un Cart
  @OneToOne(() => Cart, (cart) => cart.user)
  cart!: Cart;

  // Hook: se ejecuta ANTES de insertar en la DB
  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}