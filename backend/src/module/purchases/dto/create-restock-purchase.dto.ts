// src/purchases/dto/create-restock-purchase.dto.ts
import {
  IsUUID, IsOptional, IsString, IsDateString,
  IsArray, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RestockExistingVariantDto } from './restock-existing-variant.dto';
import { RestockNewVariantDto }      from './restock-new-variant.dto';

export class CreateRestockPurchaseDto {
  /** RN-024 */
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  supplierId!: string;

  /** RN-025 */
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  inventoryId!: string;

  // ── CAMPO AÑADIDO: fecha de compra ───────────────────────────────────────
  @ApiProperty({ example: '2026-08-16' })
  @IsDateString()
  purchaseDate!: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/invoices/factura-002.pdf' })
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  // ── CORREGIDO: antes era un solo variants[], ahora son dos arreglos ───────
  /** Variantes que ya existen en el inventario (se actualiza su stock y costo) */
  @ApiPropertyOptional({ type: [RestockExistingVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestockExistingVariantDto)
  existingVariants?: RestockExistingVariantDto[];

  /** Nuevas tallas o colores que se agregan durante el reabastecimiento */
  @ApiPropertyOptional({ type: [RestockNewVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestockNewVariantDto)
  newVariants?: RestockNewVariantDto[];
}