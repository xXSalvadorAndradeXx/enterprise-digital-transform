import {
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortOrder } from './product-filter.dto';

export enum PublicGender {
  MEN = 'MEN',
  WOMEN = 'WOMEN',
  UNISEX = 'UNISEX',
  KIDS = 'KIDS',
}

export enum PublicAvailability {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
}

const ALLOWED_PUBLIC_SORT_FIELDS = ['createdAt', 'salePrice', 'commercialName'];

export class PublicProductFilterDto {
  @ApiPropertyOptional({
    description: 'Búsqueda parcial en nombre comercial o descripción del producto',
    example: 'camisa',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID numérico (integer) de la categoría',
    example: 3,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por marca del producto',
    example: 'Nike',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    enum: PublicGender,
    description: 'Filtrar por género (MEN, WOMEN, UNISEX, KIDS)',
    example: PublicGender.MEN,
  })
  @IsOptional()
  @IsEnum(PublicGender, {
    message: 'gender debe ser uno de los siguientes valores: MEN, WOMEN, UNISEX, KIDS',
  })
  gender?: PublicGender;

  @ApiPropertyOptional({
    description: 'Filtrar por talla o medida de variante (ej. S, M, L, XL, 42)',
    example: 'M',
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    description: 'Precio efectivo mínimo (aplicado sobre el precio final al cliente)',
    example: 20.0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Precio efectivo máximo (aplicado sobre el precio final al cliente)',
    example: 80.0,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: PublicAvailability,
    description:
      'Filtrar por disponibilidad e-commerce (IN_STOCK o LOW_STOCK). OUT_OF_STOCK es rechazado con 400 Bad Request.',
    example: PublicAvailability.IN_STOCK,
  })
  @IsOptional()
  @IsIn(['IN_STOCK', 'LOW_STOCK'], {
    message:
      'availability solo permite los valores IN_STOCK o LOW_STOCK en el catálogo público',
  })
  availability?: PublicAvailability;

  @ApiPropertyOptional({
    description:
      'Si es true, retorna únicamente productos con un descuento activo y vigente',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') {
      return true;
    }
    if (value === 'false' || value === false || value === 0 || value === '0') {
      return false;
    }
    return value;
  })
  hasDiscount?: boolean;

  @ApiPropertyOptional({
    description: `Campo para ordenamiento. Lista blanca permitida: ${ALLOWED_PUBLIC_SORT_FIELDS.join(', ')}`,
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_PUBLIC_SORT_FIELDS, {
    message: `sortBy debe ser uno de los siguientes valores: ${ALLOWED_PUBLIC_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder, {
    message: 'order debe ser ASC o DESC',
  })
  order?: SortOrder;

  @ApiPropertyOptional({ description: 'Número de página', default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página (máximo 100)',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
