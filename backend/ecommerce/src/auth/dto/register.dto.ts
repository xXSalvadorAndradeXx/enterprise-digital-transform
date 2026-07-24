import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  nombre!: string;

  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsString({ message: 'El rol debe ser una cadena de texto' })
  @IsOptional() 
  rol?: string;
}