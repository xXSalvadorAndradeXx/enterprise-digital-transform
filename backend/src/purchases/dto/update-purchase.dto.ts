// src/purchases/dto/update-purchase.dto.ts
import {
  IsOptional, IsUrl,
  IsArray, ArrayMinSize, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePurchaseVariantDto } from './create-purchase-variant.dto';

export class UpdatePurchaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  invoiceUrl?: string;

@ApiPropertyOptional({ type: [CreatePurchaseVariantDto] })
@Type(() => CreatePurchaseVariantDto)
items?: CreatePurchaseVariantDto[];
}