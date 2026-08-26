import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Check,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';
import { CartStatus } from '../enums/cart-status.enum';

@Entity('carts')
@Check(
  'CHK_cart_owner_xor',
  '(customer_id IS NOT NULL AND guest_token_hash IS NULL) OR (customer_id IS NULL AND guest_token_hash IS NOT NULL)',
)
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer!: User | null;

  @Index()
  @Column({ name: 'guest_token_hash', type: 'varchar', length: 255, nullable: true })
  guestTokenHash!: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatus.ACTIVE,
  })
  status!: CartStatus;

  @Index()
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, { cascade: true })
  items!: CartItem[];

  // Propiedad virtual para compatibilidad con código legado
  total?: number;

  get user(): User | null {
    return this.customer;
  }
}