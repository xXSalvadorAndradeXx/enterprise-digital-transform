import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() size!: string;
  @ApiProperty() color!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitCost!: number;
  @ApiProperty() subtotal!: number;
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
  @ApiProperty() type!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() totalAmount!: number;
  @ApiProperty() totalQuantity!: number;
  @ApiPropertyOptional() invoiceUrl!: string | null;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ format: 'uuid' }) inventoryId!: string | null;
  @ApiProperty({ type: () => SupplierSummaryDto }) supplier!: SupplierSummaryDto;
  @ApiProperty({ type: [PurchaseItemResponseDto] }) items!: PurchaseItemResponseDto[];
  @ApiProperty({ type: () => UserSummaryDto }) createdBy!: UserSummaryDto;
  @ApiProperty() createdAt!: Date;
  @ApiPropertyOptional() deletedAt!: Date | null;
}