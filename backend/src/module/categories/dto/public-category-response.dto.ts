import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';

export class PublicCategoryResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Identificador único numérico (integer) de la categoría',
    type: 'integer',
  })
  id!: number;

  @ApiProperty({
    example: 'Calzado',
    description: 'Nombre comercial de la categoría',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Zapatos y tenis deportivos',
    description: 'Descripción pública de la categoría',
    nullable: true,
  })
  description!: string | null;

  static fromEntity(entity: Category): PublicCategoryResponseDto {
    const dto = new PublicCategoryResponseDto();
    dto.id = Number(entity.id);
    dto.name = entity.nombre;
    dto.description = entity.descripcion ?? null;
    return dto;
  }
}
