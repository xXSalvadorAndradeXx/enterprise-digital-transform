import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class AssignRolesDto {
  @IsArray({ message: 'Los roles deben ser un arreglo' })
  @ArrayNotEmpty({ message: 'El arreglo de roles no puede estar vacío' })
  @IsUUID('4', { each: true, message: 'Cada ID de rol debe ser un UUID versión 4 válido' })
  roleIds!: string[];
}
