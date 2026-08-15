import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { ProductStatus } from '../enums/product-status.enum';

export function calculateStockStatus(stock: number, minStock: number): string {
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock <= minStock) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export class ProductImageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  imageUrl!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class ProductTagResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tag!: string;

  @ApiProperty()
  createdAt!: Date;
}

export class ProductVariantConfigResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  inventoryDetailId!: string;

  @ApiProperty()
  minStock!: number;

  @ApiPropertyOptional({ example: 'SKU-SHIRT-M-RED' })
  sku?: string | null;

  @ApiPropertyOptional({ example: 'M' })
  size?: string | null;

  @ApiPropertyOptional({ example: '#FF0000' })
  color?: string | null;

  @ApiPropertyOptional({ example: 100 })
  stock?: number | null;

  @ApiPropertyOptional({
    example: 'IN_STOCK',
    description: 'Estado de stock (OUT_OF_STOCK, LOW_STOCK, IN_STOCK)',
  })
  stockStatus?: string | null;

  @ApiPropertyOptional()
  inventoryDetail?: any;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  inventoryId!: string | null;

  @ApiProperty()
  commercialName!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty()
  salePrice!: number;

  @ApiPropertyOptional()
  discount!: number | null;

  @ApiProperty({ description: 'Precio efectivo calculado aplicando el descuento' })
  effectivePrice!: number;

  @ApiPropertyOptional()
  discountEndsAt!: Date | null;

  @ApiProperty({ enum: ProductStatus })
  status!: ProductStatus;

  @ApiPropertyOptional()
  createdById!: string | null;

  @ApiPropertyOptional()
  updatedById!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional()
  inventory!: any;

  @ApiProperty({ type: [ProductImageResponseDto] })
  images!: ProductImageResponseDto[];

  @ApiProperty({ type: [ProductTagResponseDto] })
  tags!: ProductTagResponseDto[];

  @ApiProperty({ type: [ProductVariantConfigResponseDto] })
  variantConfigs!: ProductVariantConfigResponseDto[];

  static fromEntity(
    product: Product,
    calculatedEffectivePrice?: number,
  ): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.inventoryId = product.inventoryId ?? null;
    dto.commercialName = product.commercialName;
    dto.description = product.description ?? null;
    dto.salePrice = Number(product.salePrice);
    dto.discount = product.discount !== null ? Number(product.discount) : null;

    if (calculatedEffectivePrice !== undefined) {
      dto.effectivePrice = calculatedEffectivePrice;
    } else {
      const salePriceNum = Number(product.salePrice);
      const discountNum =
        product.discount !== null && product.discount !== undefined
          ? Number(product.discount)
          : 0;

      const isExpired =
        product.discountEndsAt &&
        new Date(product.discountEndsAt) < new Date();

      if (discountNum > 0 && !isExpired) {
        dto.effectivePrice = Number(
          (salePriceNum * (1 - discountNum / 100)).toFixed(2),
        );
      } else {
        dto.effectivePrice = salePriceNum;
      }
    }

    dto.discountEndsAt = product.discountEndsAt ?? null;
    dto.status = product.status;
    dto.createdById = product.createdById ?? null;
    dto.updatedById = product.updatedById ?? null;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;

    if (product.inventory) {
      const inv = product.inventory;
      dto.inventory = {
        ...inv,
        details: (inv.details || []).map((d) => ({
          ...d,
          stockStatus: calculateStockStatus(
            Number(d.stock),
            Number(d.minStock),
          ),
        })),
      };
    } else {
      dto.inventory = null;
    }

    dto.images = (product.images || []).map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      sortOrder: img.sortOrder,
      createdAt: img.createdAt,
    }));

    dto.tags = (product.tags || []).map((t) => ({
      id: t.id,
      tag: t.tag,
      createdAt: t.createdAt,
    }));

    dto.variantConfigs = (product.variantConfigs || []).map((vc) => {
      const detail = vc.inventoryDetail;
      const stock = detail ? Number(detail.stock) : 0;
      const minStock = vc.minStock !== undefined ? Number(vc.minStock) : 0;

      return {
        id: vc.id,
        inventoryDetailId: vc.inventoryDetailId,
        minStock: vc.minStock,
        sku: detail?.sku ?? null,
        size: detail?.size ?? null,
        color: detail?.color ?? null,
        stock: detail ? Number(detail.stock) : null,
        stockStatus: detail ? calculateStockStatus(stock, minStock) : null,
        inventoryDetail: detail ?? null,
        createdAt: vc.createdAt,
        updatedAt: vc.updatedAt,
      };
    });

    return dto;
  }
}
