// src/module/locations/dto/department-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Department } from '../../department/entities/department.entity';

export class DepartmentResponseDto {
  @ApiProperty({
    description: 'UUID único del departamento',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Nombre oficial del departamento',
    example: 'San Salvador',
  })
  name!: string;

  @ApiProperty({
    description: 'Código territorial del departamento',
    example: '10',
  })
  code!: string;

  /**
   * Mapea una entidad Department al DTO de respuesta,
   * exponiendo únicamente los campos necesarios para el frontend.
   */
  static fromEntity(entity: Department): DepartmentResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
    };
  }
}
