// src/purchases/dto/restock-existing-variant.dto.ts
import { IsUUID, IsInt, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestockExistingVariantDto {
  /** Referencia al inventory_detail existente */
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  inventoryDetailId!: string;

  /** RN-008 */
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity!: number;

  /** RN-003: actualiza el costo unitario histórico */
  @ApiProperty({ example: 9.00 })
  @IsNumber()
  @Min(0)
  unitCost!: number;
}