// src/modules/users/entities/user.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToMany, JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
export class User {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Juan' })
  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @ApiProperty({ example: 'García' })
  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @ApiProperty({ example: 'juan@empresa.com' })
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  // Exclude: class-transformer nunca lo incluye en la respuesta JSON
  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  @Column({ name: 'must_change_password', type: 'boolean', default: true })
  mustChangePassword: boolean;

  @Exclude()
  @Column({ name: 'failed_login_attempts', type: 'smallint', default: 0 })
  failedLoginAttempts: number;

  @Exclude()
  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Exclude()
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  // N:N con roles vía user_roles
  @ApiProperty({ type: () => [Role] })
  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn:        { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  // Getter de conveniencia — unión de todos los permisos de todos los roles
  get effectivePermissions(): string[] {
    if (!this.roles) return [];
    const codes = this.roles.flatMap((r) =>
      r.permissions?.map((p) => p.code) ?? [],
    );
    return [...new Set(codes)];
  }
}