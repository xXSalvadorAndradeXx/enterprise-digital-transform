import {
  IsString, IsNumber, IsOptional,
  IsUUID, IsPositive, Min, MaxLength, IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {

  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()                   // campo opcional
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  @Type(() => Number)             // convierte string→number si viene como texto
  price!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock!: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNotEmpty({ message: 'La categoría es requerida' })
  @IsUUID('4', { message: 'categoryId debe ser un UUID válido' })
  categoryId!: string;
}