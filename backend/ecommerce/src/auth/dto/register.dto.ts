import { IsEmail, IsString, MinLength, IsOptional, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del nuevo usuario',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre!: string;

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Correo electrónico único para la cuenta',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email!: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Contraseña de acceso (mínimo 6 caracteres)',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @ApiProperty({
    example: 'cliente',
    description: 'Rol inicial asignado al usuario (opcional)',
    required: false,
  })
  @IsString({ message: 'El rol debe ser una cadena de texto' })
  @IsOptional()
  rol?: string;
}