import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Check,
  Index,
  Unique,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity({ name: 'payments' })
@Unique(['orderId'])
@Check('payments_amount_non_negative', '"amount" >= 0')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'order_id', nullable: false })
  orderId!: string;

  @OneToOne(() => Order, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'status',
  })
  status!: PaymentStatus;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'amount',
    nullable: false,
    transformer: {
      to: (value: number | string | null) => value,
      from: (value: string | null) =>
        value === null || value === undefined ? null : String(Number(value).toFixed(2)),
    },
  })
  amount!: string;

  @Column({ type: 'varchar', length: 10, default: 'USD', name: 'currency' })
  currency!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'external_reference' })
  externalReference?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_id' })
  transactionId?: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true, name: 'card_last_four' })
  cardLastFour?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'card_brand' })
  cardBrand?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'response_code' })
  responseCode?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'approved_at' })
  approvedAt?: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'failed_at' })
  failedAt?: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'refunded_at' })
  refundedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
