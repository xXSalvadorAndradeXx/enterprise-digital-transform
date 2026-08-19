import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../enums/product-status.enum';
import { CreateProductVariantConfigDto } from './create-product-variant-config.dto';

export class CreateProductDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
  @IsUUID()
  @IsOptional()
  inventoryId?: string;

  @ApiProperty({ example: 'Smartphone X Pro' })
  @IsString()
  @IsNotEmpty()
  commercialName!: string;

  @ApiPropertyOptional({ example: 'Teléfono inteligente de alta gama' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 899.99 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  salePrice!: number;

  @ApiPropertyOptional({ example: 10.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: '2026-12-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  discountStartsAt?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  discountEndsAt?: string | null;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ example: ['https://images.com/prod1.jpg'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional({ example: ['tecnologia', 'smartphone'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: [CreateProductVariantConfigDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantConfigDto)
  @IsOptional()
  variantConfigs?: CreateProductVariantConfigDto[];
}
