import { ApiProperty } from '@nestjs/swagger';
import { InventoryResponseDto } from './inventory-response.dto';
import { InventoryDetailDto } from './inventory-detail.dto';

export class InventoryWithDetailsResponseDto extends InventoryResponseDto {
  @ApiProperty({ type: () => [InventoryDetailDto] })
  details!: InventoryDetailDto[];
}
