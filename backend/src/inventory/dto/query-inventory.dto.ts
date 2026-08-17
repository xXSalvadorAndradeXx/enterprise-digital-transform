// src/modules/inventory/dto/query-inventory.dto.ts
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsString,
  IsDateString,
  IsIn,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../enums/movement-type.enum';

export interface QueryInventoryMovementsDto {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  channel?: 'TIENDA_FISICA' | 'ECOMMERCE';
  responsibleUserId?: string;
  productId?: string;
  inventoryDetailId?: string;
  type?: MovementType;
  page?: number;
  limit?: number;
}

export class QueryMovementsDto implements QueryInventoryMovementsDto {
  @ApiPropertyOptional({
    description: 'Búsqueda por nombre del producto',
    example: 'Laptop',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    description: 'Fecha inicial del movimiento (ISO 8601 o YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha final del movimiento (ISO 8601 o YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Canal de origen del movimiento',
    enum: ['TIENDA_FISICA', 'ECOMMERCE'],
    example: 'TIENDA_FISICA',
  })
  @IsOptional()
  @IsIn(['TIENDA_FISICA', 'ECOMMERCE'])
  channel?: 'TIENDA_FISICA' | 'ECOMMERCE';

  @ApiPropertyOptional({
    description: 'ID del usuario responsable del movimiento',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  responsibleUserId?: string;

  @ApiPropertyOptional({
    description: 'ID del producto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @ApiPropertyOptional({
    description: 'ID de la variante (inventory_details.id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  inventoryDetailId?: string;

  @ApiPropertyOptional({
    enum: MovementType,
    description: 'Tipo de movimiento de inventario',
  })
  @IsOptional()
  @IsEnum(MovementType)
  type?: MovementType;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
