// src/module/locations/dto/district-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { District } from '../../branches/entities/district.entity';

export class DistrictResponseDto {
  @ApiProperty({
    description: 'Identificador del distrito',
    example: '187',
  })
  id!: string | number;

  @ApiProperty({
    description: 'Nombre oficial del distrito',
    example: 'Mejicanos',
  })
  name!: string;

  @ApiProperty({
    description: 'Código territorial del distrito',
    example: '187',
  })
  code!: string;

  @ApiProperty({
    description: 'Identificador del departamento al que pertenece el distrito',
    example: '1',
  })
  departmentId!: string | number;

  /**
   * Mapea una entidad District al DTO de respuesta,
   * exponiendo únicamente los campos necesarios para el frontend.
   */
  static fromEntity(entity: District): DistrictResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      code: (entity as any).code || '',
      departmentId: entity.departmentId,
    };
  }
}
