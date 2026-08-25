import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BranchQueryDto {
  @ApiPropertyOptional({
    example: true,
    description:
      'Si es true, retorna únicamente sucursales activas con opción de retiro en tienda (allowsPickup = true)',
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') {
      return true;
    }
    if (value === 'false' || value === false || value === 0 || value === '0') {
      return false;
    }
    return value;
  })
  allowsPickup?: boolean;
}
