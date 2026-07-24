import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SupplierQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Término de búsqueda por nombre o contacto (coincidencia case-insensitive)', example: 'san salvador' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
}
