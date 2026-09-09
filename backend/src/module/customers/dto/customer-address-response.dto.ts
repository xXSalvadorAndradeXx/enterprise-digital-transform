// src/module/customers/dto/customer-address-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepartmentResponseDto } from '../../locations/dto/department-response.dto';
import { DistrictResponseDto } from '../../locations/dto/district-response.dto';
import { CustomerAddress } from '../entities/customer-address.entity';

export class CustomerAddressResponseDto {
  @ApiProperty({
    description: 'Identificador único de la dirección (UUID v4)',
    example: '7b2e8a1d-5c43-4f2e-9d8a-1b2c3d4e5f60',
  })
  id!: string;

  @ApiProperty({
    description: 'Alias de la dirección (ej: Casa, Trabajo). Sinónimo de label.',
    example: 'Casa',
  })
  alias!: string;

  @ApiProperty({
    description: 'Etiqueta de la dirección (ej: Casa, Trabajo). Sinónimo de alias.',
    example: 'Casa',
  })
  label!: string;

  @ApiPropertyOptional({
    description: 'Nombre de la persona que recibe el paquete',
    example: 'Carlos Gómez',
    nullable: true,
  })
  recipientName?: string | null;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto para la entrega',
    example: '+50371234567',
    nullable: true,
  })
  phone?: string | null;

  @ApiProperty({
    description:
      'Identificador del departamento (útil para precargar formularios de edición)',
    example: 1,
  })
  departmentId!: number | string;

  @ApiProperty({
    description:
      'Identificador del distrito (útil para precargar formularios de edición)',
    example: 187,
  })
  districtId!: number | string;

  @ApiProperty({
    description: 'Objeto con datos del departamento',
    type: DepartmentResponseDto,
  })
  department!: DepartmentResponseDto | null;

  @ApiProperty({
    description: 'Objeto con datos del distrito',
    type: DistrictResponseDto,
  })
  district!: DistrictResponseDto | null;

  @ApiPropertyOptional({
    description: 'Ciudad de la dirección',
    example: 'San Salvador',
    nullable: true,
  })
  city?: string | null;

  @ApiProperty({
    description: 'Dirección detallada (calle, pasaje, block, etc.)',
    example: 'Residencial San Francisco, Senda 3, Casa #14',
  })
  addressLine!: string;

  @ApiPropertyOptional({
    description: 'Punto de referencia para la entrega',
    example: 'Frente al parque comunal',
    nullable: true,
  })
  reference?: string | null;

  @ApiProperty({
    description: 'Indica si es la dirección predeterminada del cliente',
    example: true,
  })
  isDefault!: boolean;

  @ApiProperty({
    description: 'Fecha y hora de registro',
    example: '2026-09-08T18:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha y hora de última actualización',
    example: '2026-09-08T18:00:00.000Z',
  })
  updatedAt!: Date;

  static fromEntity(address: CustomerAddress): CustomerAddressResponseDto {
    const label = address.label || '';
    return {
      id: address.id,
      alias: label,
      label: label,
      recipientName: address.recipientName ?? null,
      phone: address.phone ?? null,
      departmentId: address.departmentId,
      districtId: address.districtId,
      department: address.department
        ? {
            id: address.department.id,
            name: address.department.name,
            code: address.department.code,
          }
        : null,
      district: address.district
        ? {
            id: address.district.id,
            name: address.district.name,
            code: (address.district as any).code || String(address.district.id),
            departmentId: address.district.departmentId,
          }
        : null,
      city: address.city ?? null,
      addressLine: address.addressLine,
      reference: address.reference ?? null,
      isDefault: Boolean(address.isDefault),
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
