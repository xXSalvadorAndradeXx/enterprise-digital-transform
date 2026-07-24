// src/modules/products/dto/create-product.dto.ts
import {
  IsString, IsOptional, IsEnum,
  IsNumber, IsUUID, MinLength,
  MaxLength, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductUnit } from '../enums/product-unit.enum';

export class CreateProductDto {
  @ApiProperty({ example: 'PROD-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  sku: string;

  @ApiProperty({ example: 'Café molido 250g' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProductUnit, default: ProductUnit.UNIT })
  @IsOptional()
  @IsEnum(ProductUnit)
  unit?: ProductUnit;

  @ApiProperty({ example: 12.50 })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({ example: 18.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;
}