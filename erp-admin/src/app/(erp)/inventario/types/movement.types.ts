
import {
  MovementChannel,
  MovementDirection,
  MovementSortBy,
  MovementType,
  ReferenceType,
  SortOrder,
} from './enums';
import {
  MovementInventoryDetailRefDto,
  PaginationQueryDto,
  ResponsibleUserRefDto,
} from './common.types';


export interface MovementResponseDto {
  readonly id: string;
  readonly type: MovementType;
  readonly direction: MovementDirection;
  readonly quantity: number;
  readonly previousStock: number;
  readonly resultingStock: number;
  readonly channel: MovementChannel;
  readonly comment: string | null;
  readonly referenceType: ReferenceType | null;
  readonly referenceId: string | null;
  readonly responsibleUser: ResponsibleUserRefDto | null;
  readonly inventoryDetail: MovementInventoryDetailRefDto;
  readonly inventoryName: string;
  readonly createdAt: string;
}

export interface MovementQueryDto extends PaginationQueryDto {
  readonly search?: string;
  readonly direction?: MovementDirection;
  readonly inventoryId?: string;
  readonly inventoryDetailId?: string;
  readonly type?: MovementType;
  readonly channel?: MovementChannel;
  readonly responsibleUserId?: string;
  /** ISO 8601. Debe ser anterior a dateTo (422 si no se cumple). */
  readonly dateFrom?: string;
  /** ISO 8601. */
  readonly dateTo?: string;
  /** @default 'created_at' — único valor permitido por el contrato. */
  readonly sortBy?: MovementSortBy;
  /** @default 'DESC' */
  readonly order?: SortOrder;
}
export interface CreateAdjustmentDto {
  readonly inventoryDetailId: string;
  readonly quantity: number;
  readonly comment: string;
}

/**
 * Modelo estable que consume la tabla. Aísla la UI de las diferencias entre
 * el contrato actual de Backend y el contrato objetivo del módulo.
 */
export interface MovementListItem {
  readonly id: string;
  readonly direction: MovementDirection;
  readonly quantity: number;
  readonly channel: MovementChannel | null;
  readonly inventoryName: string;
  readonly responsibleUser: ResponsibleUserRefDto | null;
  readonly createdAt: string;
}
