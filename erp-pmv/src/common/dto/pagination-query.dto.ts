import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Enum para el orden de resultados.
 * TDD § 5.4 — Paginación, filtros, ordenamiento y búsqueda.
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * DTO compartido para todos los endpoints de listado paginado.
 * TDD § 5.4 — page, limit, sortBy, order, search con valores por defecto.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Número de página (base 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Cantidad de registros por página (máximo 100)',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'created_at',
    description: 'Columna por la cual ordenar los resultados',
    default: 'created_at',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({
    enum: SortOrder,
    description: 'Dirección del ordenamiento',
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    example: 'cemento',
    description: 'Búsqueda parcial (ILIKE) sobre campos de texto del módulo',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Calcula el offset para TypeORM basándose en page y limit.
   */
  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}