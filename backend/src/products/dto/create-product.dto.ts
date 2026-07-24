import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUrl } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsNumber()
  @IsNotEmpty()
  precio!: number;

  @IsNumber()
  @IsNotEmpty()
  stock!: number;

  @IsUrl()
  @IsNotEmpty()
  imagenUrl!: string;

  @IsNumber()
  @IsNotEmpty()
  categoryId!: number;
}
