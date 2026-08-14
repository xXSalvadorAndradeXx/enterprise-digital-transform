import { IsUUID, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductVariantConfigDto {
  @ApiProperty({ example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab', description: 'ID de la variante en el inventario (InventoryDetail)' })
  @IsUUID()
  @IsNotEmpty()
  inventoryDetailId!: string;

  @ApiProperty({ example: 10, description: 'Stock mínimo para alertas en la variante' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  minStock!: number;
}
