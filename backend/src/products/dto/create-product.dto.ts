import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ProductStatus } from '../enums/product-status.enum';

export class CreateProductDto {
  @IsUUID()
  @IsOptional()
  inventoryId?: string;

  @IsString()
  @IsNotEmpty()
  commercialName!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  salePrice!: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsDateString()
  @IsOptional()
  discountEndsAt?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;
}
