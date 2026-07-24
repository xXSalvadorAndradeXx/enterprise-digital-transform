import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Nombre único del rol', example: 'EDITOR' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Descripción opcional del rol', example: 'Permite editar productos', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'IDs de permisos a asociar con el rol (UUIDs)', example: ['d3b07384-d113-49cd-a5d6-8c4d5865dec9'] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}
