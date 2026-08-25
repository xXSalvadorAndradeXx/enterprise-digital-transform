import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { OrderStatus } from '../enums/order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_number', type: 'varchar', length: 50, unique: true, nullable: false })
  orderNumber!: string;

  @Column({ name: 'total', type: 'numeric', precision: 10, scale: 2, nullable: false })
  total!: number;

  @Column({ name: 'status', type: 'varchar', length: 50, default: OrderStatus.PENDING, nullable: false })
  status!: OrderStatus;

  @Column({ name: 'delivery_type', type: 'varchar', length: 50, default: 'HOME_DELIVERY', nullable: false })
  deliveryType!: string;

  @Column({ name: 'total_items', type: 'integer', default: 1, nullable: false })
  totalItems!: number;

  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
