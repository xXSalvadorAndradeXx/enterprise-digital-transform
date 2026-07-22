import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUrl } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  precio!: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  stock!: number;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsUrl()
  @IsNotEmpty()
  imagenUrl!: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  categoryId!: number;
}
