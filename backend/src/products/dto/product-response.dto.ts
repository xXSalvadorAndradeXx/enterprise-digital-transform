import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { ProductStatus } from '../enums/product-status.enum';

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

  static fromEntity(product: Product): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.inventoryId = product.inventoryId ?? null;
    dto.commercialName = product.commercialName;
    dto.description = product.description ?? null;
    dto.salePrice = Number(product.salePrice);
    dto.discount = product.discount !== null ? Number(product.discount) : null;

    const salePriceNum = Number(product.salePrice);
    const discountNum = product.discount !== null && product.discount !== undefined ? Number(product.discount) : 0;
    dto.effectivePrice = Number((salePriceNum * (1 - discountNum / 100)).toFixed(2));

    dto.discountEndsAt = product.discountEndsAt ?? null;
    dto.status = product.status;
    dto.createdById = product.createdById ?? null;
    dto.updatedById = product.updatedById ?? null;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
    dto.inventory = product.inventory ?? null;
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
    dto.variantConfigs = (product.variantConfigs || []).map((vc) => ({
      id: vc.id,
      inventoryDetailId: vc.inventoryDetailId,
      minStock: vc.minStock,
      inventoryDetail: vc.inventoryDetail ?? null,
      createdAt: vc.createdAt,
      updatedAt: vc.updatedAt,
    }));
    return dto;
  }
}
