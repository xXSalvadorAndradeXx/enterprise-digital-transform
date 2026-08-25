import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RelatedProductsQueryDto {
  @ApiPropertyOptional({
    description:
      'Cantidad máxima de productos relacionados a retornar (por defecto 4, mínimo 1, máximo 20)',
    default: 4,
    type: Number,
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 4;
}
