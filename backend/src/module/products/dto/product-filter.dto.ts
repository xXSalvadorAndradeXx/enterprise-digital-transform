import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsEnum,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ProductStatus } from '../enums/product-status.enum';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'created_at',
  'salePrice',
  'sale_price',
  'commercialName',
  'commercial_name',
];

export class ProductFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Búsqueda por nombre comercial o descripción' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ProductStatus, description: 'Filtrar por estado del producto' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Filtrar por ID del proveedor' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de la categoría' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por coincidencia exacta de etiqueta' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Precio mínimo de venta' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Precio máximo de venta' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: `Campo para ordenamiento. Valores permitidos: ${ALLOWED_SORT_FIELDS.join(', ')}`,
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_SORT_FIELDS, {
    message: `sortBy debe ser uno de los siguientes valores: ${ALLOWED_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder, {
    message: 'order debe ser ASC o DESC',
  })
  order?: SortOrder;
}
