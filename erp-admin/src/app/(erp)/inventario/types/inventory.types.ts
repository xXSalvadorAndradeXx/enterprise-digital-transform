

import { InventoryStatus, InventorySortBy, SortOrder, StockStatus } from './enums';
import { NamedRefDto, PaginationQueryDto } from './common.types';

export interface InventoryResponseDto {
  readonly id: string;
  readonly productName: string;
  readonly brand: string;
  readonly category: NamedRefDto;
  readonly supplier: NamedRefDto;
  readonly mainImageUrl: string | null;
  readonly status: InventoryStatus;
  readonly totalStock: number;
  readonly totalVariants: number;
  readonly totalInventoryCost: number;
  readonly createdAt: string;
}

export interface InventoryDetailDto {
  readonly id: string;
  readonly sku: string;
  readonly size: string;
  readonly color: string;
  readonly stock: number;
  readonly unitCost: number;
  readonly minStock: number;
  readonly stockStatus: StockStatus;
}

export interface LowStockInventoryDetailDto extends InventoryDetailDto {
  readonly inventoryName: string;
}


export interface InventoryWithDetailsDto extends InventoryResponseDto {
  readonly details: readonly InventoryDetailDto[];
}

export interface InventoryQueryDto extends PaginationQueryDto {
  /** @default 'created_at' */
  readonly sortBy?: InventorySortBy;
  /** @default 'DESC' */
  readonly order?: SortOrder;
  readonly search?: string;
  readonly supplierId?: string;
  readonly categoryId?: string;
  readonly status?: InventoryStatus;
}

export type LowStockQueryDto = PaginationQueryDto;