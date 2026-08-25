// src/module/customers/entities/customer.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { CustomerAddress } from './customer-address.entity';
import { EcommerceAuthSession } from './ecommerce-auth-session.entity';
import { Order } from './order.entity';


@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150, nullable: false })
  fullName!: string;

  @Column({ name: 'dui', type: 'varchar', length: 20, unique: true, nullable: false })
  dui!: string;

  @Column({ name: 'email', type: 'varchar', length: 150, unique: true, nullable: false })
  email!: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: false })
  phone!: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: false })
  passwordHash!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive!: boolean;

  @Column({ name: 'last_order_at', type: 'timestamptz', nullable: true })
  lastOrderAt!: Date | null;

  @Column({
    name: 'total_spent',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
    nullable: false,
  })
  totalSpent!: string | number;

  @Column({ name: 'total_orders', type: 'integer', default: 0, nullable: false })
  totalOrders!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => CustomerAddress, (address) => address.customer)
  addresses!: CustomerAddress[];

  @OneToMany(() => EcommerceAuthSession, (session) => session.customer)
  authSessions!: EcommerceAuthSession[];

  @OneToMany(() => Order, (order) => order.customer)
  orders!: Order[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizeData(): void {
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }

    if (this.dui) {
      let cleanedDui = this.dui.replace(/[^\d]/g, '');
      if (cleanedDui.length === 9) {
        cleanedDui = `${cleanedDui.substring(0, 8)}-${cleanedDui.charAt(8)}`;
      }
      this.dui = cleanedDui;
    }

    if (this.phone) {
      let cleanedPhone = this.phone.replace(/[^\d+]/g, '');
      if (/^\d{8}$/.test(cleanedPhone)) {
        cleanedPhone = `+503${cleanedPhone}`;
      }
      this.phone = cleanedPhone;
    }
  }
}
