import { IsEmail, IsString, IsNotEmpty, IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  firstName!: string;

  @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  lastName!: string;

  @ApiProperty({ description: 'Correo electrónico del usuario', example: 'juan.perez@ecommerce.local' })
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;

  @ApiProperty({
    description: 'Lista de IDs de roles a asignar al usuario (UUIDs versión 4)',
    example: ['a2b16384-c113-49cd-b5d6-8c4d5865dec1'],
    type: [String],
  })
  @IsArray({ message: 'Los roles deben ser un arreglo' })
  @IsUUID('4', { each: true, message: 'Cada ID de rol debe ser un UUID versión 4 válido' })
  roleIds!: string[];
}
