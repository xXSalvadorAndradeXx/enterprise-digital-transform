// src/purchases/dto/create-new-product-purchase.dto.ts
import {
  IsUUID, IsString, MinLength, MaxLength,
  IsOptional, IsUrl, IsArray, ArrayMinSize,
  ValidateNested, IsDateString, IsEnum, IsInt, IsPositive,
} from 'class-validator';

import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePurchaseVariantDto } from './create-purchase-variant.dto';
import { ProductGender } from '../enums/product-gender.enum';




export class CreateNewProductPurchaseDto {
  /** RN-024 */
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  supplierId!: string;

  // ── CAMPO AÑADIDO: fecha de compra ───────────────────────────────────────
  @ApiProperty({ example: '2026-08-16' })
  @IsDateString()
  purchaseDate!: string;

  @ApiProperty({ example: 'Camisa Oxford' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  productName!: string;

  // ── CORREGIDO: era @IsUUID(), ahora es number ────────────────────────────

@ApiProperty({ example: 1 })
@Transform(({ value }) => parseInt(value, 10))
@IsInt()
@IsPositive()
categoryId!: number;

  @ApiProperty({ example: 'Zara' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  brand!: string;

  // ── CAMPO AÑADIDO: género ────────────────────────────────────────────────
  @ApiPropertyOptional({ enum: ProductGender, nullable: true })
  @IsOptional()
  @IsEnum(ProductGender)
  gender?: ProductGender | null;

  @ApiPropertyOptional({ example: 'https://cdn.erp.com/images/camisa.jpg' })
  @IsOptional()
  @IsUrl()
  mainImageUrl?: string;

  /** RN-021: la URL proviene de POST /purchases/upload-invoice */
  @ApiPropertyOptional({ example: 'https://cdn.erp.com/invoices/inv-001.pdf' })
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  /** RN-026: mínimo 1 variante */
  @ApiProperty({ type: [CreatePurchaseVariantDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseVariantDto)
  variants!: CreatePurchaseVariantDto[];
}