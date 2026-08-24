// src/module/customers/dto/ecommerce-register.dto.ts
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  Length,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE } from '../../../common/constants/password.constant';

export class EcommerceRegisterDto {
  @ApiProperty({
    description: 'Nombre completo del cliente',
    example: 'Carlos Eduardo Gómez',
    minLength: 3,
    maxLength: 150,
  })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  @Length(3, 150, { message: 'El nombre completo debe tener entre 3 y 150 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  fullName!: string;

  @ApiProperty({
    description: 'DUI (Documento Único de Identidad) de El Salvador, con o sin guion',
    example: '01234567-8',
  })
  @IsString({ message: 'El DUI debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El DUI es obligatorio' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    let cleaned = value.replace(/[^\d]/g, '');
    if (cleaned.length === 9) {
      cleaned = `${cleaned.substring(0, 8)}-${cleaned.charAt(8)}`;
    }
    return cleaned;
  })
  @Matches(/^\d{8}-\d$/, { message: 'El DUI debe tener el formato válido XXXXXXXX-X' })
  dui!: string;

  @ApiProperty({
    description: 'Teléfono de contacto de El Salvador (+503)',
    example: '+50371234567',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    let cleaned = value.replace(/[^\d+]/g, '');
    if (/^\d{8}$/.test(cleaned)) {
      cleaned = `+503${cleaned}`;
    }
    return cleaned;
  })
  @Matches(/^\+503[267]\d{7}$/, { message: 'El teléfono debe ser un número válido de El Salvador (+503XXXXXXXX)' })
  phone!: string;

  @ApiProperty({
    description: 'Correo electrónico del cliente (se guardará en minúsculas)',
    example: 'carlos.gomez@correo.com',
  })
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  email!: string;

  @ApiProperty({
    description: 'Contraseña del cliente para inicio de sesión (mínimo 12 caracteres, mayúscula, minúscula, número y símbolo)',
    example: 'SeguraPassword123!',
    minLength: 12,
    maxLength: 100,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @Matches(PASSWORD_POLICY_REGEX, {
    message: PASSWORD_POLICY_MESSAGE,
  })
  password!: string;


  @ApiProperty({
    description: 'UUID versión 4 del departamento de la dirección principal',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'El ID del departamento debe ser un UUID versión 4 válido' })
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  departmentId!: string;

  @ApiProperty({
    description: 'UUID versión 4 del distrito de la dirección principal',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID('4', { message: 'El ID del distrito debe ser un UUID versión 4 válido' })
  @IsNotEmpty({ message: 'El distrito es obligatorio' })
  districtId!: string;

  @ApiPropertyOptional({
    description: 'Ciudad de la dirección principal',
    example: 'San Salvador',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La ciudad no puede exceder los 100 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  city?: string;

  @ApiProperty({
    description: 'Dirección detallada (calle, pasaje, block, etc.) de la dirección principal',
    example: 'Residencial San Francisco, Senda 3, Casa #14',
    minLength: 5,
    maxLength: 500,
  })
  @IsString({ message: 'La dirección detallada debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La dirección detallada es obligatoria' })
  @Length(5, 500, { message: 'La dirección detallada debe tener entre 5 y 500 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  addressLine!: string;
}
