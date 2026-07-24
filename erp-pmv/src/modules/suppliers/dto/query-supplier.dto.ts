// src/modules/suppliers/dto/query-supplier.dto.ts
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySupplierDto {
  @ApiPropertyOptional({ example: 'volcán' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}