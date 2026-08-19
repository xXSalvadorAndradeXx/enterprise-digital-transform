import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryStatus } from '../enums/inventory-status.enum';

export class CategoryRelationDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Tecnología' })
  name!: string;
}

export class SupplierRelationDto {
  @ApiProperty({ example: 'd3b07384-d113-4ec5-a581-22920268a044' })
  id!: string;

  @ApiProperty({ example: 'Sony Corporation' })
  name!: string;
}

export class InventoryResponseDto {
  @ApiProperty({ example: 'd3b07384-d113-4ec5-a581-22920268a045' })
  id!: string;

  @ApiProperty({ example: 'Audífonos Bluetooth' })
  productName!: string;

  @ApiProperty({ example: 'Sony' })
  brand!: string;

  @ApiProperty({ type: () => CategoryRelationDto })
  category!: CategoryRelationDto;

  @ApiProperty({ type: () => SupplierRelationDto })
  supplier!: SupplierRelationDto;

  @ApiPropertyOptional({ example: 'https://images.com/product.jpg' })
  mainImageUrl!: string | null;

  @ApiProperty({ enum: InventoryStatus, example: InventoryStatus.ACTIVE })
  status!: InventoryStatus;

  @ApiProperty({ example: 150 })
  totalStock!: number;

  @ApiProperty({ example: 3 })
  totalVariants!: number;

  @ApiProperty({
    example: 475.5,
    description:
      'Costo total del inventario calculado como SUM(stock * unit_cost)',
  })
  totalInventoryCost!: number;

  @ApiProperty({ example: '2026-08-06T20:17:10Z' })
  createdAt!: Date;
}
