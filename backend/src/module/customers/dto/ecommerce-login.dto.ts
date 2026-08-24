// src/module/customers/dto/ecommerce-login.dto.ts
import { IsEmail, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EcommerceLoginDto {
  @ApiProperty({
    description: 'Correo electrónico del cliente',
    example: 'carlos.gomez@correo.com',
  })
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;

  @ApiProperty({
    description: 'Contraseña del cliente',
    example: 'SeguraPassword123!',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password!: string;

  @ApiPropertyOptional({
    description: 'Indica si se debe mantener la sesión iniciada por más tiempo',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'rememberMe debe ser un valor booleano' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  rememberMe: boolean = false;
}
