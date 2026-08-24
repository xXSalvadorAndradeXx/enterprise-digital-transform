import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Check,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderDelivery } from './order-delivery.entity';
import { GuestCustomer } from './guest-customer.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { User } from '../../users/entities/user.entity';
import { DeliveryMethod } from '../enums/delivery-method.enum';

@Entity({ name: 'orders' })
@Check('orders_totals_non_negative', '"subtotal" >= 0 AND "discount_total" >= 0 AND "delivery_cost" >= 0 AND "total_amount" >= 0')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Identificador público mostrado a los clientes
  @Column({ type: 'varchar', length: 8, unique: true })
  orderNumber!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'subtotal',
    nullable: false,
    default: '0.00',
    transformer: {
      to: (value: number | string | null) => value,
      from: (value: string | null) => value === null || value === undefined ? null : String(Number(value).toFixed(2)),
    },
  })
  subtotal!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'discount_total',
    nullable: false,
    default: '0.00',
    transformer: {
      to: (value: number | string | null) => value,
      from: (value: string | null) => value === null || value === undefined ? null : String(Number(value).toFixed(2)),
    },
  })
  discountTotal!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'delivery_cost',
    nullable: false,
    default: '0.00',
    transformer: {
      to: (value: number | string | null) => value,
      from: (value: string | null) => value === null || value === undefined ? null : String(Number(value).toFixed(2)),
    },
  })
  deliveryCost!: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_amount',
    nullable: false,
    default: '0.00',
    transformer: {
      to: (value: number | string | null) => value,
      from: (value: string | null) => value === null || value === undefined ? null : String(Number(value).toFixed(2)),
    },
  })
  totalAmount!: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.NEW })
  status!: OrderStatus;

  @Column({
    type: 'enum',
    enum: DeliveryMethod,
    default: DeliveryMethod.HOME_DELIVERY,
    name: 'delivery_method',
  })
  deliveryMethod!: DeliveryMethod;

  // Relación con el cliente (usuario autenticado)
  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  customerId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer?: User | null;

  // Relación con el cliente invitado (usuario no autenticado)
  @Column({ type: 'uuid', nullable: true, name: 'guest_customer_id' })
  guestCustomerId?: string | null;

  @ManyToOne(() => GuestCustomer, (guest) => guest.orders, {
    nullable: true,
    cascade: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'guest_customer_id' })
  guestCustomer?: GuestCustomer | null;

  // Snapshot del comprador (inmutabilidad histórica)
  @Column({ type: 'varchar', length: 150, nullable: true, name: 'customer_email' })
  customerEmail?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true, name: 'customer_name' })
  customerName?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'customer_phone' })
  customerPhone?: string | null;

  // Relaciones
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToOne(() => OrderDelivery, (delivery) => delivery.order, {
    cascade: true,
    nullable: true,
  })
  delivery?: OrderDelivery;

  @OneToMany(() => OrderStatusHistory, (hist) => hist.order, {
    cascade: true,
  })
  statusHistory!: OrderStatusHistory[];

  // Auditoría
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'contact_snapshot' })
  contactSnapshot?: Record<string, any>;
}


