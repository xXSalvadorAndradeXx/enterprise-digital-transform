import { IsOptional, IsString, IsNumber, Min, IsEnum, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

const ALLOWED_SORT_FIELDS = ['precio', 'stock', 'createdAt'];

export class ProductFilterDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
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
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

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
