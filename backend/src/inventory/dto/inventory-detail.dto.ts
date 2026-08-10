import { ApiProperty } from '@nestjs/swagger';
import { StockStatus } from '../enums/stock-status.enum';

export class InventoryDetailDto {
  @ApiProperty({ example: 'd3b07384-d113-4ec5-a581-22920268a046' })
  id!: string;

  @ApiProperty({ example: 'SKU-SONY-WH1000-BLK' })
  sku!: string;

  @ApiProperty({ example: 'M' })
  size!: string;

  @ApiProperty({ example: '#000000' })
  color!: string;

  @ApiProperty({ example: 50 })
  stock!: number;

  @ApiProperty({ example: 120.50 })
  unitCost!: number;

  @ApiProperty({ example: 10 })
  minStock!: number;

  @ApiProperty({ enum: StockStatus, example: StockStatus.ALTO })
  stockStatus!: StockStatus;
}
