// src/purchases/dto/restock-new-variant.dto.ts
import {
  IsString, MinLength, MaxLength,
  Matches, IsInt, IsNumber, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestockNewVariantDto {
  /** Nueva talla que no existe aún en el inventario */
  @ApiProperty({ example: 'XL' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  size!: string;

  /** Nuevo color en formato hexadecimal */
  @ApiProperty({ example: '#000000' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color debe ser un código hexadecimal válido (#RRGGBB)',
  })
  color!: string;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 9.50 })
  @IsNumber()
  @Min(0)
  unitCost!: number;
}