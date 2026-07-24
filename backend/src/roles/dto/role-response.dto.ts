import { Expose, Type } from 'class-transformer';

export class PermissionResponseDto {
  @Expose()
  id!: string;

  @Expose()
  code!: string;

  @Expose()
  description!: string | null;
}

export class RoleResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description!: string | null;

  @Expose()
  isSystem!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  userCount!: number;

  @Expose()
  permissionCount!: number;

  @Expose()
  @Type(() => PermissionResponseDto)
  permissions!: PermissionResponseDto[];
}
