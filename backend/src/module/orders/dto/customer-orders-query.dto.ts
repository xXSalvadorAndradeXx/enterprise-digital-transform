import { IsOptional, IsInt, Min, Max, IsEnum, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../enums/order-status.enum';

export enum SortOrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class CustomerOrdersQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página a consultar (debe ser mayor o igual a 1)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página (entre 1 y 100)',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El límite no puede exceder los 100 registros' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      'Filtrar por estado de la orden (NEW, PENDING, ON_ROUTE, READY_FOR_PICKUP, DELIVERED, CANCELLED)',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(OrderStatus, {
    message: 'El estado especificado no es un estado de orden válido',
  })
  status?: OrderStatus;

  @ApiPropertyOptional({
    description:
      'Ordenamiento por fecha de creación (DESC = más recientes primero, ASC = más antiguos primero)',
    enum: SortOrderEnum,
    default: SortOrderEnum.DESC,
    example: SortOrderEnum.DESC,
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'], { message: 'El ordenamiento debe ser ASC o DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
