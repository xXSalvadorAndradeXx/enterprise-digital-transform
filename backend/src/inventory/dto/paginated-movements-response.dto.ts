import { ApiProperty } from '@nestjs/swagger';
import { MovementResponseDto } from './movement-response.dto';
import { PaginationMetaDto } from './paginated-inventory-response.dto';

export class PaginatedMovementsResponseDto {
  @ApiProperty({ type: [MovementResponseDto] })
  data!: MovementResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
