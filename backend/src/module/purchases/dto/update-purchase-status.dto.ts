// src/purchases/dto/update-purchase-status.dto.ts
import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePurchaseStatusDto {
  @ApiProperty({ enum: ['RECEIVED', 'CANCELLED'], example: 'RECEIVED' })
  @IsIn(['RECEIVED', 'CANCELLED'], {
    message: 'status debe ser RECEIVED o CANCELLED',
  })
  status!: 'RECEIVED' | 'CANCELLED';
}