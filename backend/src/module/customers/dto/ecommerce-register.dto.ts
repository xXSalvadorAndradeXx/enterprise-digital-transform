// src/module/customers/dto/ecommerce-register.dto.ts
import {
  IsEmail,
  IsString,
  IsNotEmpty,
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
    description: 'Contraseña del cliente para inicio de sesión (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo)',
    example: 'SeguraPassword123!',
    minLength: 8,
    maxLength: 100,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @Matches(PASSWORD_POLICY_REGEX, {
    message: PASSWORD_POLICY_MESSAGE,
  })
  password!: string;

  @ApiProperty({
    description: 'Identificador del departamento de la dirección principal',
    example: '1',
  })
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  departmentId!: string | number;

  @ApiProperty({
    description: 'Identificador del distrito de la dirección principal',
    example: '187',
  })
  @IsNotEmpty({ message: 'El distrito es obligatorio' })
  districtId!: string | number;

  @ApiProperty({
    description: 'Ciudad de la dirección principal',
    example: 'San Salvador',
    maxLength: 100,
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  @MaxLength(100, { message: 'La ciudad no puede exceder los 100 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  city!: string;

  @ApiPropertyOptional({
    description: 'Dirección detallada (calle, pasaje, block, etc.)',
    example: 'Residencial San Francisco, Senda 3, Casa #14',
    minLength: 5,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @Length(5, 500, { message: 'La dirección debe tener entre 5 y 500 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  address?: string;

  @ApiPropertyOptional({
    description: 'Dirección detallada (calle, pasaje, block, etc.) - alias heredado',
    example: 'Residencial San Francisco, Senda 3, Casa #14',
    minLength: 5,
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La dirección detallada debe ser una cadena de texto' })
  @Length(5, 500, { message: 'La dirección detallada debe tener entre 5 y 500 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  addressLine?: string;
}