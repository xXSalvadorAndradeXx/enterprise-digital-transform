import { ApiProperty } from '@nestjs/swagger';
import { InventoryDetailDto } from './inventory-detail.dto';

export class LowStockResponseDto extends InventoryDetailDto {
  @ApiProperty({ example: 'Audífonos Inalámbricos WH1000' })
  inventoryName!: string;
}
