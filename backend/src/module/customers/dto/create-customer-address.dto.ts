// src/module/customers/dto/create-customer-address.dto.ts
import { IsUUID, IsString, IsNotEmpty, IsOptional, IsBoolean, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerAddressDto {
  @ApiProperty({
    description: 'UUID versión 4 del departamento de la dirección',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'El ID del departamento debe ser un UUID versión 4 válido' })
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  departmentId!: string;

  @ApiProperty({
    description: 'UUID versión 4 del distrito de la dirección',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID('4', { message: 'El ID del distrito debe ser un UUID versión 4 válido' })
  @IsNotEmpty({ message: 'El distrito es obligatorio' })
  districtId!: string;

  @ApiPropertyOptional({
    description: 'Ciudad de la dirección',
    example: 'San Salvador',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La ciudad no puede exceder los 100 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  city?: string;

  @ApiProperty({
    description: 'Dirección detallada (calle, pasaje, block, etc.)',
    example: 'Residencial San Francisco, Senda 3, Casa #14',
    minLength: 5,
    maxLength: 500,
  })
  @IsString({ message: 'La dirección detallada debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La dirección detallada es obligatoria' })
  @Length(5, 500, { message: 'La dirección detallada debe tener entre 5 y 500 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  addressLine!: string;

  @ApiProperty({
    description: 'Etiqueta amigable de identificación para la dirección',
    example: 'Casa',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'La etiqueta debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La etiqueta es obligatoria' })
  @Length(2, 50, { message: 'La etiqueta debe tener entre 2 y 50 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  label!: string;

  @ApiPropertyOptional({
    description: 'Define si es la dirección predeterminada del cliente',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isDefault debe ser un valor booleano' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isDefault: boolean = false;
}
