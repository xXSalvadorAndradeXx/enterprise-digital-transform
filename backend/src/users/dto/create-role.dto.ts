import { IsString, MinLength, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsString({ message: 'El nombre del rol debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre del rol debe tener al menos 3 caracteres' })
  name!: string;

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  description?: string;

  @IsArray({ message: 'Los permisos deben ser un arreglo' })
  @IsUUID('4', { each: true, message: 'Cada ID de permiso debe ser un UUID versión 4 válido' })
  permissionIds!: string[];
}
