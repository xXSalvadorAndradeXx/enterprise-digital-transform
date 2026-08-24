import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Branch } from '../entities/branch.entity';

export class PublicTerritoryDto {
  @ApiProperty({ example: 1, description: 'Identificador único numérico (integer)' })
  id!: number;

  @ApiProperty({ example: 'San Salvador', description: 'Nombre del territorio' })
  name!: string;
}

export class PublicBranchResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890', description: 'ID de la sucursal' })
  id!: string;

  @ApiProperty({ example: 'SUC-001', description: 'Código único funcional de la sucursal' })
  code!: string;

  @ApiProperty({ example: 'Sucursal Central Escalón', description: 'Nombre de la sucursal' })
  name!: string;

  @ApiPropertyOptional({ example: 'Paseo General Escalón #1234', description: 'Dirección física', nullable: true })
  address!: string | null;

  @ApiPropertyOptional({ example: '2222-0000', description: 'Teléfono de contacto', nullable: true })
  phone!: string | null;

  @ApiProperty({ example: true, description: 'Indica si la sucursal permite retiro en tienda' })
  allowsPickup!: boolean;

  @ApiPropertyOptional({ type: PublicTerritoryDto, description: 'Departamento asociado', nullable: true })
  department!: PublicTerritoryDto | null;

  @ApiPropertyOptional({ type: PublicTerritoryDto, description: 'Distrito asociado', nullable: true })
  district!: PublicTerritoryDto | null;

  static fromEntity(entity: Branch): PublicBranchResponseDto {
    const dto = new PublicBranchResponseDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.address = entity.address ?? null;
    dto.phone = entity.phone ?? null;
    dto.allowsPickup = entity.allowsPickup ?? false;

    dto.department = entity.department
      ? { id: Number(entity.department.id), name: entity.department.name }
      : null;

    dto.district = entity.district
      ? { id: Number(entity.district.id), name: entity.district.name }
      : null;

    return dto;
  }
}
