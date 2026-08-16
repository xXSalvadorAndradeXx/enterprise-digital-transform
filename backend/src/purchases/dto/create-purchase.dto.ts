// src/purchases/dto/create-purchase.dto.ts
import {
  IsUUID, IsOptional, IsUrl,
  IsArray, ArrayMinSize, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePurchaseVariantDto } from './create-purchase-variant.dto';

export class CreatePurchaseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  supplierId!: string;

  @ApiPropertyOptional({ example: 'https://storage.com/facturas/001.pdf' })
  @IsOptional()
  @IsUrl()
  invoiceUrl?: string;

@ApiProperty({ type: [CreatePurchaseVariantDto] })
@Type(() => CreatePurchaseVariantDto)
items!: CreatePurchaseVariantDto[];
}