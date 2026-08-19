// src/purchases/dto/purchase-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductGender } from '../enums/product-gender.enum';

export class PurchaseItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() size!: string;
  @ApiProperty() color!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitCost!: number;
  @ApiProperty() subtotal!: number;

  
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  inventoryDetailId!: string | null;
}

export class SupplierSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}

export class UserSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
}

export class PurchaseResponseDto {
  @ApiProperty() id!: string;

  @ApiProperty({ example: 'CP-0007' })
  reference!: string;

  @ApiProperty() type!: string;
  @ApiProperty() productName!: string;

  @ApiProperty({ example: 'Nike' })
  brand!: string;

  @ApiProperty({ example: 1 })
  categoryId!: number;

  @ApiPropertyOptional({ enum: ProductGender, nullable: true })
  gender!: ProductGender | null;

  @ApiProperty({ example: '2026-08-16' })
  purchaseDate!: string;

  @ApiProperty() totalAmount!: number;
  @ApiProperty() totalQuantity!: number;

  @ApiPropertyOptional() invoiceUrl!: string | null;
  @ApiProperty()         status!: string;

  @ApiPropertyOptional({ format: 'uuid' }) inventoryId!: string | null;

  @ApiProperty({ type: () => SupplierSummaryDto }) supplier!: SupplierSummaryDto;
  @ApiProperty({ type: [PurchaseItemResponseDto] }) items!: PurchaseItemResponseDto[];
  @ApiProperty({ type: () => UserSummaryDto })      createdBy!: UserSummaryDto;

  @ApiProperty()         createdAt!: Date;
  @ApiPropertyOptional() deletedAt!: Date | null;
}

// ── Respuesta paginada ───────────────────────────────────────────────────────
export class PaginationMetaDto {
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}

export class PaginatedPurchaseResponseDto {
  @ApiProperty({ type: [PurchaseResponseDto] }) data!: PurchaseResponseDto[];
  @ApiProperty({ type: () => PaginationMetaDto }) meta!: PaginationMetaDto;
}