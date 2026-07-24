// src/modules/roles/dto/create-role.dto.ts
import {
  IsString, MinLength, MaxLength,
  IsOptional, IsArray, IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Bodeguero' })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'Gestiona inventario y recepciona compras.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}