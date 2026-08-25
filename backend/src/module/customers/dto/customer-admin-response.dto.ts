import { Expose, Type } from 'class-transformer';

export class DepartmentResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;
}

export class DistrictResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;
}

export class CustomerAddressAdminResponseDto {
  @Expose()
  id!: string;

  @Expose()
  label!: string;

  @Expose()
  @Type(() => DepartmentResponseDto)
  department!: DepartmentResponseDto;

  @Expose()
  @Type(() => DistrictResponseDto)
  district!: DistrictResponseDto;

  @Expose()
  city!: string;

  @Expose()
  addressLine!: string;

  @Expose()
  isDefault!: boolean;
}

export class CustomerAdminResponseDto {
  @Expose()
  id!: string;

  @Expose()
  fullName!: string;

  @Expose()
  dui!: string;

  @Expose()
  email!: string;

  @Expose()
  phone!: string;

  @Expose()
  isActive!: boolean;

  @Expose()
  lastOrderAt!: Date | null;

  @Expose()
  totalSpent!: string;

  @Expose()
  totalOrders!: number;

  @Expose()
  @Type(() => CustomerAddressAdminResponseDto)
  addresses!: CustomerAddressAdminResponseDto[];
}
