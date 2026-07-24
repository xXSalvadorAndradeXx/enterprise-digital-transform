// src/modules/purchases/dto/create-purchase.dto.ts
import {
  IsUUID, IsString, IsOptional,
  IsArray, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePurchaseItemDto } from './create-purchase-item.dto';

export class CreatePurchaseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  supplierId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}