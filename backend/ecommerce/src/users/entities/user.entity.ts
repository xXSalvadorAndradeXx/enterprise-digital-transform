import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Cart } from '../../cart/entities/cart.entity';
import { RefreshToken } from './refresh-token.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { Role } from './role.entity';

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

<<<<<<< HEAD
  @Column({ name: 'must_change_password', type: 'boolean', default: true, nullable: false })
  mustChangePassword!: boolean;

  @Column({ name: 'failed_login_attempts', type: 'smallint', default: 0, nullable: false })
  failedLoginAttempts!: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
=======
  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isBlocked!: boolean;

  @CreateDateColumn()
>>>>>>> Feature/BE-auth-module
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToOne(() => Cart, (cart) => cart.user)
  cart!: Cart;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => PasswordResetToken, (resetToken) => resetToken.user)
  passwordResetTokens!: PasswordResetToken[];

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];
}
