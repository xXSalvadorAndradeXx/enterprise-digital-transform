import { IsOptional, IsString, IsNumber, IsUUID, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterProductDto {

  @IsOptional()
  @IsString()
  search?: string;          // búsqueda en nombre y descripción

  @IsOptional()
  @IsUUID()
  categoryId?: string;      // filtrar por categoría

  @IsOptional()
  @Type(() => Number)        // convierte "10" → 10 automáticamente
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(['name', 'price', 'createdAt'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}