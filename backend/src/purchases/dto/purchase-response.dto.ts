// src/purchases/dto/purchase-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PurchaseStatus } from '../enums/purchase-status.enum';

export class PurchaseItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() quantity: number;
  @ApiProperty() unitCost: number;
  @ApiProperty() subtotal: number;
}

export class PurchaseResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() supplierId: string;
  @ApiProperty() totalAmount: number;
  @ApiProperty({ enum: PurchaseStatus }) status: PurchaseStatus;
  @ApiPropertyOptional() receivedAt: Date | null;
  @ApiPropertyOptional() invoiceUrl: string | null;
  @ApiProperty() createdBy: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ type: [PurchaseItemResponseDto] }) items: PurchaseItemResponseDto[];
}