import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicProductResponseDto } from '../../products/dto/public-product-response.dto';

export class FavoriteProductSummaryDto extends PublicProductResponseDto {
  @ApiPropertyOptional({
    example: 'http://localhost:3000/uploads/products/front-01.webp',
    description: 'URL resoluble de la imagen principal del producto para la tarjeta e-commerce',
    nullable: true,
  })
  imageUrl!: string | null;

  @ApiProperty({
    example: true,
    description: 'Indica si el producto cuenta con un descuento activo y vigente actualmente',
  })
  hasDiscount!: boolean;

  static fromPublicDto(publicDto: PublicProductResponseDto): FavoriteProductSummaryDto {
    const summary = Object.assign(new FavoriteProductSummaryDto(), publicDto);
    summary.imageUrl = publicDto.primaryImage ?? (publicDto.images?.length ? publicDto.images[0] : null);
    
    const isDiscountObj = publicDto.discount && typeof publicDto.discount === 'object';
    summary.hasDiscount = Boolean(isDiscountObj && (publicDto.discount as any).isActive);

    if (!publicDto.isPublished) {
      summary.availability = 'UNAVAILABLE';
      summary.inStock = false;
    } else if (publicDto.stockTotal <= 0) {
      summary.availability = 'OUT_OF_STOCK';
      summary.inStock = false;
    }
    
    return summary;
  }
}

export class FavoriteResponseDto {
  @ApiProperty({
    example: 'c9f8a7b6-e5d4-4000-a000-ef1234567890',
    description: 'Identificador único UUID de la relación de favorito',
  })
  favoriteId!: string;

  @ApiProperty({
    example: '2026-08-25T20:00:00.000Z',
    description: 'Fecha y hora en que se agregó a favoritos (formato ISO 8601)',
  })
  createdAt!: string;

  @ApiProperty({
    type: FavoriteProductSummaryDto,
    description: 'Resumen comercial del producto compatible con la tarjeta de e-commerce Frontend',
  })
  product!: FavoriteProductSummaryDto;
}

export class PaginatedFavoritesResponseDto {
  @ApiProperty({
    type: [FavoriteResponseDto],
    description: 'Listado de elementos de favoritos en la página actual',
  })
  items!: FavoriteResponseDto[];

  @ApiProperty({
    example: 15,
    description: 'Total de productos guardados en favoritos por el cliente',
  })
  total!: number;

  @ApiProperty({
    example: 1,
    description: 'Número de página actual',
  })
  page!: number;

  @ApiProperty({
    example: 10,
    description: 'Cantidad de registros solicitados por página',
  })
  limit!: number;

  @ApiProperty({
    example: 2,
    description: 'Total de páginas disponibles según el límite',
  })
  totalPages!: number;
}
