import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRolesDto {
  @ApiProperty({
    description: 'Lista de IDs de roles a asignar al usuario (UUIDs versión 4). Reemplaza completamente los roles actuales.',
    example: ['b3b16384-c113-49cd-b5d6-8c4d5865dec2'],
    type: [String],
  })
  @IsArray({ message: 'Los roles deben ser un arreglo' })
  @ArrayNotEmpty({ message: 'El arreglo de roles no puede estar vacío' })
  @IsUUID('4', { each: true, message: 'Cada ID de rol debe ser un UUID versión 4 válido' })
  roleIds!: string[];
}

