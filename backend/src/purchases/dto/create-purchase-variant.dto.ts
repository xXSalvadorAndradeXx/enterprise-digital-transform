// src/purchases/dto/create-purchase-variant.dto.ts
import { IsString, MinLength, MaxLength, Matches, IsInt, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseVariantDto {
  /** RN-004 */
  @ApiProperty({ example: 'L', description: 'Talla (ej: S, M, L, XL, 38, 40)' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  size!: string;

  /** RN-004 */
  @ApiProperty({ example: '#FFFFFF', description: 'Color en formato hexadecimal #RRGGBB' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color debe ser un código hexadecimal válido (#RRGGBB)',
  })
  color!: string;

  /** RN-008 */
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity!: number;

  /** RN-009: se permiten artículos de costo cero */
  @ApiProperty({ example: 20.00 })
  @IsNumber()
  @Min(0)
  unitCost!: number;
}