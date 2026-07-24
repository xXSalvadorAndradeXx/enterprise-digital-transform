// src/modules/product-categories/dto/create-product-category.dto.ts
import {
  IsString, IsOptional,
  MinLength, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Bebidas' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Bebidas frías y calientes' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}