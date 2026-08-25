import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';

export class PublicCategoryResponseDto {
  @ApiProperty({
    example: 3,
    description: 'Identificador único numérico (integer) de la categoría',
    type: 'integer',
  })
  id!: number;

  @ApiProperty({
    example: 'Calzado',
    description: 'Nombre comercial de la categoría',
  })
  name!: string;

  @ApiProperty({
    example: 'calzado',
    description: 'Slug amigable para navegación y URLs del e-commerce',
  })
  slug!: string;

  @ApiProperty({
    example: 12,
    description: 'Cantidad de productos publicados y disponibles asociados a esta categoría',
    type: 'integer',
  })
  publishedProductsCount!: number;

  @ApiPropertyOptional({
    example: 'Zapatos y tenis deportivos',
    description: 'Descripción pública de la categoría',
    nullable: true,
  })
  description!: string | null;

  static generateSlug(text: string): string {
    if (!text) return '';
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  static fromEntity(
    entity: Category,
    publishedProductsCount = 0,
  ): PublicCategoryResponseDto {
    const dto = new PublicCategoryResponseDto();
    dto.id = Number(entity.id);
    dto.name = entity.nombre;
    dto.slug = PublicCategoryResponseDto.generateSlug(entity.nombre);
    dto.publishedProductsCount = Number(publishedProductsCount ?? 0);
    dto.description = entity.descripcion ?? null;
    return dto;
  }
}
