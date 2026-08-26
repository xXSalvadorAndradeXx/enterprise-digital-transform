import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { PublicCategoryResponseDto } from '../../categories/dto/public-category-response.dto';
import { UrlUtil } from '../../../common/utils/url.util';

export class PublicDiscountInfoDto {
  @ApiProperty({
    example: 20,
    description: 'Porcentaje de descuento aplicado (0 a 100)',
  })
  percentage!: number;

  @ApiProperty({
    example: true,
    description: 'Indica si el descuento se encuentra activo y vigente según fecha actual',
  })
  isActive!: boolean;
}

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
    example: 'M',
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

export class PublicProductDetailImageDto {
  @ApiProperty({
    example: 'http://localhost:3000/uploads/products/front.webp',
    description: 'URL absoluta resoluble de la imagen',
  })
  url!: string;

  @ApiProperty({
    example: true,
    description: 'Indica si es la imagen principal pública del producto',
  })
  isPrimary!: boolean;
}

export class PublicProductDetailVariantDto {
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
    example: 'M',
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
    example: 8,
    description: 'Existencia total disponible comercialmente para esta variante',
  })
  stock!: number;

  @ApiProperty({
    example: true,
    description: 'Indica si la variante se encuentra disponible para venta (stock > 0)',
  })
  available!: boolean;
}

export class PublicProductResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890',
    description: 'Identificador único UUID del producto',
  })
  id!: string;

  @ApiProperty({
    example: 'Camisa deportiva',
    description: 'Nombre comercial del producto',
  })
  commercialName!: string;

  @ApiPropertyOptional({
    example: 'Camisa deportiva para uso diario',
    description: 'Descripción pública del producto',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({
    example: 'Nike',
    description: 'Marca asociada al producto',
    nullable: true,
  })
  brand!: string | null;

  @ApiPropertyOptional({
    example: 'MEN',
    description: 'Género comercial (MEN, WOMEN, UNISEX, KIDS)',
    nullable: true,
  })
  gender!: string | null;

  @ApiPropertyOptional({
    type: PublicCategoryResponseDto,
    description: 'Categoría asociada al producto',
    nullable: true,
  })
  category!: PublicCategoryResponseDto | null;

  @ApiProperty({
    example: '35.00',
    description: 'Precio base de venta formateado como string decimal (2 decimales)',
    type: 'string',
  })
  salePrice!: string;

  @ApiProperty({
    example: '28.00',
    description: 'Precio final efectivo formateado como string decimal después de evaluar descuentos vigentes',
    type: 'string',
  })
  effectivePrice!: string;

  @ApiProperty({
    example: '28.00',
    description: 'Alias de compatibilidad para el precio final efectivo',
    type: 'string',
  })
  finalPrice!: string;

  @ApiPropertyOptional({
    type: PublicDiscountInfoDto,
    description: 'Información del descuento actual y su estado de vigencia',
    nullable: true,
  })
  discount!: PublicDiscountInfoDto | string | null;

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
    example: 18,
    description: 'Existencia total disponible comercialmente para venta',
    type: 'integer',
  })
  stockTotal!: number;

  @ApiProperty({
    example: 'IN_STOCK',
    description: 'Estado comercial global de disponibilidad (IN_STOCK o LOW_STOCK)',
  })
  availability!: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/uploads/products/product-01.webp',
    description: 'URL absoluta resoluble de la imagen principal pública',
    nullable: true,
  })
  primaryImage!: string | null;

  @ApiProperty({
    example: ['S', 'M', 'L'],
    description: 'Listado único de tallas que realmente poseen disponibilidad activa',
    type: [String],
  })
  availableSizes!: string[];

  @ApiProperty({
    example: ['http://localhost:3000/uploads/products/product-01.webp'],
    description: 'URLs absolutas de todas las imágenes públicas del producto',
    type: [String],
  })
  images!: string[];

  @ApiProperty({
    example: ['moda', 'verano'],
    description: 'Etiquetas comerciales del producto',
    type: [String],
  })
  tags!: string[];

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
    dto.brand = entity.inventory?.brand ?? null;
    dto.gender = entity.inventory?.gender ?? null;
    dto.isPublished = entity.isPublished ?? false;
    dto.publishedAt = entity.publishedAt ? entity.publishedAt.toISOString() : null;

    const rawSalePrice = Number(entity.salePrice ?? 0);
    const rawDiscountPercentage = Number(entity.discount ?? 0);
    const rawEffectivePrice = Number(effectivePriceNum ?? rawSalePrice);

    dto.salePrice = rawSalePrice.toFixed(2);
    dto.effectivePrice = rawEffectivePrice.toFixed(2);
    dto.finalPrice = rawEffectivePrice.toFixed(2);

    dto.discountStartsAt = entity.discountStartsAt
      ? entity.discountStartsAt.toISOString()
      : null;
    dto.discountEndsAt = entity.discountEndsAt
      ? entity.discountEndsAt.toISOString()
      : null;

    const now = new Date();
    const isStartsValid =
      !entity.discountStartsAt || entity.discountStartsAt <= now;
    const isEndsValid = !entity.discountEndsAt || entity.discountEndsAt >= now;
    const isDiscountActive =
      rawDiscountPercentage > 0 && isStartsValid && isEndsValid;

    if (rawDiscountPercentage > 0) {
      dto.discount = {
        percentage: rawDiscountPercentage,
        isActive: isDiscountActive,
      };
    } else {
      dto.discount = null;
    }

    const sortedImages = entity.images
      ? entity.images.sort((a, b) => a.sortOrder - b.sortOrder)
      : [];
    dto.images = sortedImages
      .map((img) => UrlUtil.resolveImageUrl(img.imageUrl))
      .filter((url): url is string => url !== null);

    dto.primaryImage = dto.images.length > 0 ? dto.images[0] : null;

    dto.tags = entity.tags ? entity.tags.map((t) => t.tag) : [];

    dto.category = entity.inventory?.category
      ? PublicCategoryResponseDto.fromEntity(entity.inventory.category)
      : null;

    const invStock = entity.inventory ? Number(entity.inventory.stock ?? (entity.inventory as any).available ?? 0) : 0;
    const invMinStock = entity.inventory ? Number((entity.inventory as any).minStock ?? 5) : 5;

    dto.stockTotal = invStock;
    dto.inStock = inStock && invStock > 0;
    dto.availability =
      invStock > 0 && invStock <= invMinStock ? 'LOW_STOCK' : 'IN_STOCK';

    const sizesSet = new Set<string>();

    const details = entity.variantConfigs?.length
      ? entity.variantConfigs.map((vc) => vc.inventoryDetail).filter(Boolean)
      : entity.inventory?.details ?? [];

    dto.variants = [];
    if (entity.variantConfigs?.length) {
      dto.variants = entity.variantConfigs.map((vc) => {
        const detail = vc.inventoryDetail;
        const stock = detail ? Number(detail.stock) : 0;
        const minStock = detail ? Number(detail.minStock ?? vc.minStock) : 0;
        let stockStatus = 'OUT_OF_STOCK';
        if (stock > 0) {
          stockStatus = stock <= minStock ? 'LOW_STOCK' : 'IN_STOCK';
          if (detail?.size) {
            sizesSet.add(detail.size);
          }
        }
        return {
          id: vc.id,
          sku: detail?.sku ?? null,
          size: detail?.size ?? null,
          color: detail?.color ?? null,
          stock,
          stockStatus,
        };
      });
    } else {
      dto.variants = details.map((detail) => {
        const stock = Number(detail.stock ?? 0);
        const minStock = Number(detail.minStock ?? 5);
        let stockStatus = 'OUT_OF_STOCK';
        if (stock > 0) {
          stockStatus = stock <= minStock ? 'LOW_STOCK' : 'IN_STOCK';
          if (detail.size) {
            sizesSet.add(detail.size);
          }
        }
        return {
          id: detail.id,
          sku: detail.sku ?? null,
          size: detail.size ?? null,
          color: detail.color ?? null,
          stock,
          stockStatus,
        };
      });
    }

    dto.availableSizes = Array.from(sizesSet);

    return dto;
  }
}

export class PublicProductDetailResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890',
    description: 'Identificador único UUID del producto',
  })
  id!: string;

  @ApiProperty({
    example: 'Camisa deportiva',
    description: 'Nombre comercial del producto',
  })
  commercialName!: string;

  @ApiPropertyOptional({
    example: 'Camisa deportiva para uso diario',
    description: 'Descripción pública del producto',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({
    example: 'Nike',
    description: 'Marca asociada al producto',
    nullable: true,
  })
  brand!: string | null;

  @ApiPropertyOptional({
    example: 'MEN',
    description: 'Género comercial (MEN, WOMEN, UNISEX, KIDS)',
    nullable: true,
  })
  gender!: string | null;

  @ApiPropertyOptional({
    type: PublicCategoryResponseDto,
    description: 'Categoría asociada al producto con id, name y slug',
    nullable: true,
  })
  category!: PublicCategoryResponseDto | null;

  @ApiProperty({
    example: '35.00',
    description: 'Precio base de venta formateado como string decimal (2 decimales)',
    type: 'string',
  })
  salePrice!: string;

  @ApiProperty({
    example: '28.00',
    description: 'Precio final efectivo formateado como string decimal después de evaluar descuentos vigentes',
    type: 'string',
  })
  effectivePrice!: string;

  @ApiPropertyOptional({
    type: PublicDiscountInfoDto,
    description: 'Información del descuento actual y su estado de vigencia',
    nullable: true,
  })
  discount!: PublicDiscountInfoDto | null;

  @ApiProperty({
    example: 18,
    description: 'Existencia total disponible comercialmente para venta',
    type: 'integer',
  })
  stockTotal!: number;

  @ApiProperty({
    example: 'IN_STOCK',
    description: 'Estado comercial global de disponibilidad (IN_STOCK o LOW_STOCK)',
  })
  availability!: string;

  @ApiProperty({
    type: [PublicProductDetailImageDto],
    description: 'Listado completo de imágenes públicas con indicador isPrimary y URLs absolutas',
  })
  images!: PublicProductDetailImageDto[];

  @ApiProperty({
    type: [PublicProductDetailVariantDto],
    description: 'Variantes configuradas con atributos de talla, color, stock y disponibilidad',
  })
  variants!: PublicProductDetailVariantDto[];

  @ApiProperty({
    example: ['nuevo', 'deportivo', 'casual'],
    description: 'Etiquetas comerciales públicas asociadas al producto',
    type: [String],
  })
  tags!: string[];

  static fromEntity(
    entity: Product,
    effectivePriceNum: number,
    inStock = true,
  ): PublicProductDetailResponseDto {
    const dto = new PublicProductDetailResponseDto();
    dto.id = entity.id;
    dto.commercialName = entity.commercialName;
    dto.description = entity.description ?? null;
    dto.brand = entity.inventory?.brand ?? null;
    dto.gender = entity.inventory?.gender ?? null;

    const rawSalePrice = Number(entity.salePrice ?? 0);
    const rawDiscountPercentage = Number(entity.discount ?? 0);
    const rawEffectivePrice = Number(effectivePriceNum ?? rawSalePrice);

    dto.salePrice = rawSalePrice.toFixed(2);
    dto.effectivePrice = rawEffectivePrice.toFixed(2);

    const now = new Date();
    const isStartsValid =
      !entity.discountStartsAt || entity.discountStartsAt <= now;
    const isEndsValid = !entity.discountEndsAt || entity.discountEndsAt >= now;
    const isDiscountActive =
      rawDiscountPercentage > 0 && isStartsValid && isEndsValid;

    if (rawDiscountPercentage > 0) {
      dto.discount = {
        percentage: rawDiscountPercentage,
        isActive: isDiscountActive,
      };
    } else {
      dto.discount = null;
    }

    dto.category = entity.inventory?.category
      ? PublicCategoryResponseDto.fromEntity(entity.inventory.category)
      : null;

    const invStock = entity.inventory ? Number(entity.inventory.stock ?? (entity.inventory as any).available ?? 0) : 0;
    const invMinStock = entity.inventory ? Number((entity.inventory as any).minStock ?? 5) : 5;

    dto.stockTotal = invStock;
    dto.availability =
      invStock > 0 && invStock <= invMinStock ? 'LOW_STOCK' : 'IN_STOCK';

    const sortedImages = entity.images
      ? entity.images.sort((a, b) => a.sortOrder - b.sortOrder)
      : [];

    dto.images = sortedImages.map((img, idx) => ({
      url: UrlUtil.resolveImageUrl(img.imageUrl) ?? '',
      isPrimary: idx === 0,
    }));

    dto.tags = entity.tags ? entity.tags.map((t) => t.tag) : [];

    const details = entity.variantConfigs?.length
      ? entity.variantConfigs.map((vc) => vc.inventoryDetail).filter(Boolean)
      : entity.inventory?.details ?? [];

    if (entity.variantConfigs?.length) {
      dto.variants = entity.variantConfigs.map((vc) => {
        const detail = vc.inventoryDetail;
        const stock = detail ? Number(detail.stock) : 0;
        return {
          id: vc.id,
          sku: detail?.sku ?? null,
          size: detail?.size ?? null,
          color: detail?.color ?? null,
          stock,
          available: stock > 0,
        };
      });
    } else {
      dto.variants = details.map((detail) => {
        const stock = Number(detail.stock ?? 0);
        return {
          id: detail.id,
          sku: detail.sku ?? null,
          size: detail.size ?? null,
          color: detail.color ?? null,
          stock,
          available: stock > 0,
        };
      });
    }

    return dto;
  }
}
