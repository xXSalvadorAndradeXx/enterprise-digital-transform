// src/modules/purchases/dto/update-purchase.dto.ts
import {
  IsOptional, IsString, IsArray,
  ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePurchaseItemDto } from './create-purchase-item.dto';

export class UpdatePurchaseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreatePurchaseItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items?: CreatePurchaseItemDto[];
}