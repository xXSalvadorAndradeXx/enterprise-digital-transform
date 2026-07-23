import { Supplier } from '../entities/supplier.entity';

export class SupplierResponseDto {
  id!: string;
  name!: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: Supplier): SupplierResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      contactName: entity.contactName ?? null,
      phone: entity.phone ?? null,
      email: entity.email ?? null,
      address: entity.address ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
