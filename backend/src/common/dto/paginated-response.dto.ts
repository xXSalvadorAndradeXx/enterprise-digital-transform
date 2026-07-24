import { ApiProperty } from '@nestjs/swagger';

/**
 * Metadatos de paginación incluidos en toda respuesta de listado.
 * TDD § 5.1 — Formato de respuesta de listado paginado.
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 132, description: 'Total de registros encontrados' })
  total: number;

  @ApiProperty({ example: 1, description: 'Página actual' })
  page: number;

  @ApiProperty({ example: 20, description: 'Registros por página' })
  limit: number;

  @ApiProperty({ example: 7, description: 'Total de páginas' })
  totalPages: number;
}

/**
 * Respuesta genérica para listados paginados.
 * TDD § 5.1 — { data[], meta: { total, page, limit, totalPages } }
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

/**
 * Función utilitaria para construir una respuesta paginada estandarizada.
 * Usada en todos los services de listado para no repetir la construcción del meta.
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponseDto<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}