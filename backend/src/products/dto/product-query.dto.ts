// src/products/dto/product-query.dto.ts

import { IsOptional, IsIn } from 'class-validator';

export class ProductQueryDto {
  @IsOptional()
  @IsIn(['name', 'price', 'createdAt', 'stock'], {
    message: 'sortBy debe ser: name, price, createdAt o stock',
  })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'order debe ser: asc o desc',
  })
  order?: 'asc' | 'desc' = 'asc';
}