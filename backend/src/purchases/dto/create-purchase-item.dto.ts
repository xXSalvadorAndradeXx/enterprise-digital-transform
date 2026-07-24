// src/modules/purchases/dto/create-purchase-item.dto.ts
import { IsUUID, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 25.50 })
  @IsNumber()
  @Min(0)
  unitCost: number;
}