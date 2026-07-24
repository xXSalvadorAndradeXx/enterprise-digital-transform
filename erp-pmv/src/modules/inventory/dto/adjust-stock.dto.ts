// src/modules/inventory/dto/adjust-stock.dto.ts
import {
  IsUUID, IsNumber, IsEnum,
  IsOptional, IsString, IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../enums/movement-type.enum';

export class AdjustStockDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId: string;

  @ApiProperty({ example: 10, description: 'Positivo = entrada, negativo = salida' })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ enum: MovementType, example: MovementType.ADJUSTMENT })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiPropertyOptional({ example: 'Ajuste por conteo físico' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  referenceId?: string;
}