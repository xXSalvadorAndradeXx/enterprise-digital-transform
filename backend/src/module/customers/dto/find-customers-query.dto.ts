import { IsOptional, IsInt, Min, IsString, IsBoolean, IsDate, Max, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindCustomersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El límite no puede exceder los 100 registros' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  isActive?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'lastOrderFrom debe ser una fecha válida' })
  lastOrderFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'lastOrderTo debe ser una fecha válida' })
  lastOrderTo?: Date;

  @IsOptional()
  @IsIn(['fullName', 'lastOrderAt', 'totalSpent', 'totalOrders'], {
    message: 'sortBy debe ser uno de: fullName, lastOrderAt, totalSpent, totalOrders',
  })
  sortBy?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  @IsIn(['ASC', 'DESC'], {
    message: 'order debe ser ASC o DESC',
  })
  order?: 'ASC' | 'DESC' = 'DESC';
}
