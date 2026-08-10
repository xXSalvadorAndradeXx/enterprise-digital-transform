import { Expose, Type } from 'class-transformer';

export class RoleResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description!: string | null;
}

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  firstName!: string;

  @Expose()
  lastName!: string;

  @Expose()
  email!: string;

  @Expose()
  isActive!: boolean;

  @Expose()
  isBlocked!: boolean;

  @Expose()
  mustChangePassword!: boolean;

  @Expose()
  failedLoginAttempts!: number;

  @Expose()
  lockedUntil!: Date | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  @Type(() => RoleResponseDto)
  roles!: RoleResponseDto[];

  @Expose()
  permissions?: string[];
}
