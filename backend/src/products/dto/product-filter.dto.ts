import { IsOptional, IsString, IsNumber, Min, IsEnum, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProductStatus } from '../enums/product-status.enum';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

const ALLOWED_SORT_FIELDS = ['salePrice', 'createdAt', 'status'];

export class ProductFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_SORT_FIELDS, {
    message: `sortBy debe ser uno de los siguientes valores: ${ALLOWED_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(SortOrder, {
    message: 'order debe ser ASC o DESC',
  })
  order?: SortOrder;
}
