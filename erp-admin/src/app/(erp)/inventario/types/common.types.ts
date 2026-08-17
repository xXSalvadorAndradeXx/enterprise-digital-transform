
export interface PaginationMetaDto {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

/**
 * Respuesta estándar para endpoints de listado paginado.
 * { "data": T[], "meta": PaginationMetaDto }
 */
export interface PaginatedResponseDto<T> {
  readonly data: readonly T[];
  readonly meta: PaginationMetaDto;
}

/**
 * Respuesta estándar para endpoints de un único recurso.
 * { "data": T, "statusCode": number }
 */
export interface ApiItemResponseDto<T> {
  readonly data: T;
  readonly statusCode: number;
}

/**
 * Forma estándar de error de la API pública (ValidationPipe / exception filters
 * de Nest). `message` puede ser un string único o un arreglo de errores de
 * validación (caso típico de 422).
 */
export interface ApiErrorResponseDto {
  readonly statusCode: number;
  readonly message: string | readonly string[];
  readonly error?: string;
  readonly timestamp?: string;
  readonly path?: string;
}

/** Parámetros de paginación compartidos por InventoryQueryDto y MovementQueryDto. */
export interface PaginationQueryDto {
  /** Número de página. @default 1 */
  readonly page?: number;
  /** Registros por página (máx. 100). @default 20 */
  readonly limit?: number;
}

/** Referencia mínima a una entidad con id + nombre (categoría, proveedor). */
export interface NamedRefDto {
  readonly id: string;
  readonly name: string;
}

/** Referencia mínima al usuario responsable de un movimiento — RN-M-004/012. */
export interface ResponsibleUserRefDto {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
}

/** Referencia mínima a la variante (inventory_detail) afectada por un movimiento. */
export interface MovementInventoryDetailRefDto {
  readonly id: string;
  readonly sku: string;
  readonly size: string;
  readonly color: string;
}