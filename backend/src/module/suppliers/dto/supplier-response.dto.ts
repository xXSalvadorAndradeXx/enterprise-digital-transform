import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Supplier } from '../entities/supplier.entity';

export class SupplierResponseDto {
  @ApiProperty({ description: 'UUID único del proveedor', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'Nombre del proveedor', example: 'Distribuidora San Salvador' })
  name!: string;

  @ApiPropertyOptional({ description: 'Nombre del contacto del proveedor', example: 'Juan Pérez', nullable: true })
  contactName?: string | null;

  @ApiPropertyOptional({ description: 'Teléfono de contacto formateado E.164 para El Salvador (+503)', example: '+50375943334', nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Correo electrónico de contacto', example: 'contacto@sansalvador.sv', nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ description: 'Dirección física del proveedor', example: 'Calle Principal #123, San Salvador', nullable: true })
  address?: string | null;

  @ApiProperty({ description: 'Fecha de creación del registro', example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de última actualización', example: '2026-01-01T00:00:00.000Z' })
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
