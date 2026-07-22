import { IsEmail, IsString, IsNotEmpty, IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  firstName!: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  lastName!: string;

  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;

  @IsArray({ message: 'Los roles deben ser un arreglo' })
  @IsUUID('4', { each: true, message: 'Cada ID de rol debe ser un UUID versión 4 válido' })
  roleIds!: string[];
}
