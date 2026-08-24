import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { PublicCategoryResponseDto } from '../../categories/dto/public-category-response.dto';

export class PublicProductVariantResponseDto {
  @ApiProperty({
    example: 'var-cfg-uuid-1',
    description: 'ID de la configuración de variante',
  })
  id!: string;

  @ApiPropertyOptional({
    example: 'SKU-TENIS-NEGRO-42',
    description: 'SKU único de la variante',
    nullable: true,
  })
  sku!: string | null;

  @ApiPropertyOptional({
    example: '42',
    description: 'Talla o medida de la variante',
    nullable: true,
  })
  size!: string | null;

  @ApiPropertyOptional({
    example: 'Negro',
    description: 'Color de la variante',
    nullable: true,
  })
  color!: string | null;

  @ApiProperty({
    example: 15,
    description: 'Cantidad en stock disponible',
  })
  stock!: number;

  @ApiProperty({
    example: 'IN_STOCK',
    description: 'Estado comercial de stock de la variante',
  })
  stockStatus!: string;
}

export class PublicProductResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890',
    description: 'Identificador único UUID del producto',
  })
  id!: string;

  @ApiProperty({
    example: 'Camisa básica de algodón',
    description: 'Nombre comercial del producto',
  })
  commercialName!: string;

  @ApiPropertyOptional({
    example: 'Camisa confeccionada en 100% algodón orgánico',
    description: 'Descripción pública del producto',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: '24.99',
    description: 'Precio normal de venta formateado como string decimal (2 decimales)',
    type: 'string',
  })
  salePrice!: string;

  @ApiProperty({
    example: '10.00',
    description: 'Porcentaje de descuento aplicado (0.00 a 100.00) formateado como string decimal',
    type: 'string',
  })
  discount!: string;

  @ApiProperty({
    example: '22.49',
    description: 'Precio final efectivo formateado como string decimal (salePrice * (1 - discount/100))',
    type: 'string',
  })
  finalPrice!: string;

  @ApiPropertyOptional({
    example: '2026-08-01T00:00:00.000Z',
    description: 'Fecha de inicio del descuento (ISO 8601)',
    nullable: true,
  })
  discountStartsAt!: string | null;

  @ApiPropertyOptional({
    example: '2026-08-31T23:59:59.000Z',
    description: 'Fecha de fin del descuento (ISO 8601)',
    nullable: true,
  })
  discountEndsAt!: string | null;

  @ApiProperty({
    example: ['https://cdn.ecommerce.com/img1.jpg'],
    description: 'URLs de imágenes del producto',
    type: [String],
  })
  images!: string[];

  @ApiProperty({
    example: ['moda', 'verano'],
    description: 'Etiquetas comerciales del producto',
    type: [String],
  })
  tags!: string[];

  @ApiPropertyOptional({
    type: PublicCategoryResponseDto,
    description: 'Categoría asociada al producto',
    nullable: true,
  })
  category!: PublicCategoryResponseDto | null;

  @ApiProperty({
    example: true,
    description: 'Indica si el producto tiene stock disponible para compra',
  })
  inStock!: boolean;

  @ApiProperty({
    example: true,
    description: 'Indica si el producto está publicado en el e-commerce',
  })
  isPublished!: boolean;

  @ApiPropertyOptional({
    example: '2026-08-15T12:00:00.000Z',
    description: 'Fecha y hora de publicación en e-commerce (ISO 8601)',
    nullable: true,
  })
  publishedAt!: string | null;

  @ApiProperty({
    type: [PublicProductVariantResponseDto],
    description: 'Variantes disponibles comercialmente para el e-commerce',
  })
  variants!: PublicProductVariantResponseDto[];

  static fromEntity(
    entity: Product,
    effectivePriceNum: number,
    inStock = true,
  ): PublicProductResponseDto {
    const dto = new PublicProductResponseDto();
    dto.id = entity.id;
    dto.commercialName = entity.commercialName;
    dto.description = entity.description ?? null;
    dto.isPublished = entity.isPublished ?? false;
    dto.publishedAt = entity.publishedAt ? entity.publishedAt.toISOString() : null;

    // Transformación estricta de valores monetarios a string decimal
    const rawSalePrice = Number(entity.salePrice ?? 0);
    const rawDiscount = Number(entity.discount ?? 0);
    const rawFinalPrice = Number(effectivePriceNum ?? rawSalePrice);

    dto.salePrice = rawSalePrice.toFixed(2);
    dto.discount = rawDiscount.toFixed(2);
    dto.finalPrice = rawFinalPrice.toFixed(2);

    dto.discountStartsAt = entity.discountStartsAt
      ? entity.discountStartsAt.toISOString()
      : null;
    dto.discountEndsAt = entity.discountEndsAt
      ? entity.discountEndsAt.toISOString()
      : null;

    dto.images = entity.images
      ? entity.images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.imageUrl)
      : [];

    dto.tags = entity.tags ? entity.tags.map((t) => t.tag) : [];

    dto.category = entity.inventory?.category
      ? PublicCategoryResponseDto.fromEntity(entity.inventory.category)
      : null;

    dto.inStock = inStock;

    dto.variants = entity.variantConfigs
      ? entity.variantConfigs.map((vc) => {
          const detail = vc.inventoryDetail;
          const stock = detail ? Number(detail.stock) : 0;
          const minStock = detail ? Number(detail.minStock ?? vc.minStock) : 0;
          let stockStatus = 'OUT_OF_STOCK';
          if (stock > 0) {
            stockStatus = stock <= minStock ? 'LOW_STOCK' : 'IN_STOCK';
          }
          return {
            id: vc.id,
            sku: detail?.sku ?? null,
            size: detail?.size ?? null,
            color: detail?.color ?? null,
            stock,
            stockStatus,
          };
        })
      : [];

    return dto;
  }
}
