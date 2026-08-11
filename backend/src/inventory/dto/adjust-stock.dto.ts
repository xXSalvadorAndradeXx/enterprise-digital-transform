// src/modules/inventory/dto/adjust-stock.dto.ts
import {
  IsUUID,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../enums/movement-type.enum';
import { MovementChannel } from '../enums/movement-channel.enum';

export class AdjustStockDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'ID de la variante afectada (inventory_details.id)',
    example: 'd3b07384-d113-4ec5-a581-22920268a044',
  })
  @IsOptional()
  @IsUUID('4')
  inventoryDetailId?: string;

  @ApiProperty({
    example: 10,
    description: 'Positivo = entrada, negativo = salida',
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ enum: MovementType, example: MovementType.IN })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiPropertyOptional({
    enum: MovementChannel,
    example: MovementChannel.TIENDA_FISICA,
    description: 'Canal de origen del movimiento (TIENDA_FISICA o ECOMMERCE)',
  })
  @IsOptional()
  @IsEnum(MovementChannel)
  channel?: MovementChannel;

  @ApiPropertyOptional({ example: 'Ajuste por conteo físico' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  referenceId?: string;
}
