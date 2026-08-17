// src/purchases/dto/update-purchase-metadata.dto.ts
import {
  IsOptional, IsUUID, IsString, IsDateString,
  IsEnum, IsArray, ValidateNested, IsInt,
  IsNumber, IsPositive, Min, MinLength, MaxLength,
  Matches, ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductGender } from '../enums/product-gender.enum';

export class UpdatePurchaseVariantDto {
  /** UUID del supplier_purchase_item existente */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @ApiPropertyOptional({ example: 'XS' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({ example: '#F50505' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color debe ser un código hexadecimal válido (#RRGGBB)',
  })
  color?: string;

  /** RN-008: entero positivo */
  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  /** RN-009: >= 0 */
  @ApiPropertyOptional({ example: 20.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class UpdatePurchaseMetadataDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @ApiPropertyOptional({ example: '2026-08-16' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 'Camisa Oxford' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  productName?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : value))
  @IsInt()
  @IsPositive()
  categoryId?: number;

  @ApiPropertyOptional({ example: 'Puma' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  brand?: string;

  @ApiPropertyOptional({ enum: ProductGender, nullable: true })
  @IsOptional()
  @IsEnum(ProductGender)
  gender?: ProductGender | null;

  /** RN-021/022 — admite null para borrar la factura */
  @ApiPropertyOptional({ example: 'https://cdn.erp.com/invoices/inv-001.pdf', nullable: true })
  @IsOptional()
  @IsString()
  invoiceUrl?: string | null;

  /** Mínimo 1 variante cuando se envía el arreglo */
  @ApiPropertyOptional({ type: [UpdatePurchaseVariantDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseVariantDto)
  variants?: UpdatePurchaseVariantDto[];
}