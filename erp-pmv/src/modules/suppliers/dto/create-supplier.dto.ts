// src/modules/suppliers/dto/create-supplier.dto.ts
import {
  IsString, IsEmail, IsOptional,
  MinLength, MaxLength, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Distribuidora El Volcán S.A.' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: '0614-123456-101-1' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxId?: string;

  @ApiPropertyOptional({ example: 'contacto@volcan.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: '+503 2222-3333' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'Calle Principal #10, San Salvador' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Carlos Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactName?: string;

  @ApiPropertyOptional({ example: 'Entrega los martes y jueves.' })
  @IsOptional()
  @IsString()
  notes?: string;
}