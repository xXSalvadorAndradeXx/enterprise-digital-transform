import { IsOptional, IsInt, Min, IsString, IsBoolean, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'El correo de búsqueda debe ser una cadena de texto' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'El estado activo debe ser un booleano' })
  isActive?: boolean;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de rol debe ser un UUID versión 4 válido' })
  roleId?: string;
}
