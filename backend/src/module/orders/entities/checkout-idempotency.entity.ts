import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CheckoutSource } from '../enums/checkout-source.enum';
import { CheckoutIdempotencyStatus } from '../enums/checkout-idempotency-status.enum';

@Entity('checkout_idempotencies')
export class CheckoutIdempotency {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  key!: string;

  @Column({ type: 'varchar', length: 64, name: 'request_hash' })
  requestHash!: string;

  @Column({
    type: 'enum',
    enum: CheckoutSource,
    nullable: true,
  })
  source!: CheckoutSource | null;

  @Index()
  @Column({ type: 'uuid', name: 'cart_id', nullable: true })
  cartId!: string | null;

  @Index()
  @Column({ type: 'uuid', name: 'customer_id', nullable: true })
  customerId!: string | null;

  @Index()
  @Column({ type: 'uuid', name: 'order_id', nullable: true })
  orderId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  response!: any;

  @Index()
  @Column({
    type: 'enum',
    enum: CheckoutIdempotencyStatus,
  })
  status!: CheckoutIdempotencyStatus;

  @Index()
  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
