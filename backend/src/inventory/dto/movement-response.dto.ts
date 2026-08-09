import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../enums/movement-type.enum';

export class MovementProductDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Audífonos Bluetooth' })
  nombre!: string;
}

export class MovementUserDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Juan' })
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  lastName!: string;
}

export class MovementResponseDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;

  @ApiProperty({ enum: MovementType })
  type!: MovementType;

  @ApiProperty({ example: 10 })
  quantity!: number;

  @ApiProperty({ example: 90 })
  stockBefore!: number;

  @ApiProperty({ example: 100 })
  stockAfter!: number;

  @ApiPropertyOptional({ example: 'Ajuste por conteo físico' })
  notes!: string | null;

  @ApiPropertyOptional({ example: 'uuid-de-referencia' })
  referenceId!: string | null;

  @ApiProperty({ example: '2026-08-06T20:17:10Z' })
  createdAt!: string;

  @ApiPropertyOptional({ type: MovementProductDto })
  product!: MovementProductDto | null;

  @ApiPropertyOptional({ type: MovementUserDto })
  createdBy!: MovementUserDto | null;
}