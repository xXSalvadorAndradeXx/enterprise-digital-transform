import { IsUUID, IsInt, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestockVariantDto {
  /** RN-003: referencia al detalle de inventario existente */
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  inventoryDetailId!: string;

  /** RN-008 */
  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  quantity!: number;

  /** RN-003: actualiza costo histórico */
  @ApiProperty({ example: 18.50 })
  @IsNumber()
  @Min(0)
  unitCost!: number;
}