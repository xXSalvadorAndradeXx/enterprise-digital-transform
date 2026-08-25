// src/module/customers/entities/ecommerce-auth-session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('ecommerce_auth_sessions')
@Index(['customerId'])
@Index(['expiresAt'])
@Index(['revokedAt'])
export class EcommerceAuthSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.authSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: false })
  refreshTokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: false })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'ip_hash', type: 'varchar', length: 64, nullable: true })
  ipHash!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
