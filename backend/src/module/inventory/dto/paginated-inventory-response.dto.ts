import { ApiProperty } from '@nestjs/swagger';
import { InventoryResponseDto } from './inventory-response.dto';

export class PaginationMetaDto {
  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;
}

export class PaginatedInventoryResponseDto {
  @ApiProperty({ type: () => [InventoryResponseDto] })
  data!: InventoryResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta!: PaginationMetaDto;
}
