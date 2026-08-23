  // src/module/locations/dto/district-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { District } from '../../district/entities/district.entity';

export class DistrictResponseDto {
  @ApiProperty({
    description: 'UUID único del distrito',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id!: string;

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
    description: 'UUID del departamento al que pertenece el distrito',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  departmentId!: string;

  /**
   * Mapea una entidad District al DTO de respuesta,
   * exponiendo únicamente los campos necesarios para el frontend.
   */
  static fromEntity(entity: District): DistrictResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      departmentId: entity.departmentId,
    };
  }
}
