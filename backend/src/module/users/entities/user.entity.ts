//backend\src\users\entities\user.entity.ts

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  DeleteDateColumn, 
  OneToOne, 
  ManyToMany, 
  JoinTable,
  OneToMany
} from 'typeorm';
import { Cart } from '../../cart/entities/cart.entity';
import { Role } from '../../roles/entities/role.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { RefreshToken } from './refresh-token.entity';
import { CustomerAddress } from './customer-address.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: false })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: false })
  lastName!: string;

  @Column({ name: 'email', type: 'varchar', length: 150, unique: true, nullable: false })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: false })
  passwordHash!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive!: boolean;

  @Column({ default: false })
  isBlocked!: boolean;

  @Column({ name: 'must_change_password', type: 'boolean', default: true, nullable: false })
  mustChangePassword!: boolean;

  @Column({ name: 'failed_login_attempts', type: 'smallint', default: 0, nullable: false })
  failedLoginAttempts!: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'token_version', type: 'integer', default: 0, nullable: false })
  tokenVersion!: number;

  @Column({ name: 'total_orders', type: 'integer', default: 0 })
  totalOrders!: number;

  @Column({ name: 'total_spent', type: 'decimal', precision: 12, scale: 2, default: '0.00' })
  totalSpent!: string;

  @Column({ name: 'last_order_at', type: 'timestamptz', nullable: true })
  lastOrderAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToOne(() => Cart, (cart) => cart.user)
  cart!: Cart;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens!: PasswordResetToken[];

  @OneToMany(() => RefreshToken, (token) => token.user)

  @OneToMany(() => CustomerAddress, (address) => address.user)
  addresses!: CustomerAddress[];
  refreshTokens!: RefreshToken[];
}