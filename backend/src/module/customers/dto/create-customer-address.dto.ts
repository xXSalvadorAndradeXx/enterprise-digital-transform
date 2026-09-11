// src/module/customers/dto/create-customer-address.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Length,
  MaxLength,
  ValidateIf,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerAddressDto {
  @ApiProperty({
    description: 'Identificador del departamento de la dirección',
    example: '1',
  })
  @IsString({
    message: 'El ID del departamento debe ser una cadena de texto o ID válido',
  })
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  departmentId!: string;

  @ApiProperty({
    description: 'Identificador del distrito de la dirección',
    example: '187',
  })
  @IsString({
    message: 'El ID del distrito debe ser una cadena de texto o ID válido',
  })
  @IsNotEmpty({ message: 'El distrito es obligatorio' })
  districtId!: string;

  @ApiPropertyOptional({
    description:
      'Alias amigable para identificar la dirección (ej: Casa, Oficina). Sinónimo de label.',
    example: 'Casa',
    minLength: 2,
    maxLength: 50,
  })
  @ValidateIf((o) => !o.label || o.alias !== undefined)
  @IsNotEmpty({
    message: 'Debe ingresar un alias o label para identificar la dirección',
  })
  @IsString({ message: 'El alias debe ser una cadena de texto' })
  @Length(2, 50, { message: 'El alias debe tener entre 2 y 50 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  alias?: string;

  @ApiPropertyOptional({
    description:
      'Etiqueta amigable de identificación (ej: Casa, Trabajo). Sinónimo de alias.',
    example: 'Casa',
    minLength: 2,
    maxLength: 50,
  })
  @ValidateIf((o) => !o.alias || o.label !== undefined)
  @IsNotEmpty({
    message: 'Debe ingresar un alias o label para identificar la dirección',
  })
  @IsString({ message: 'La etiqueta debe ser una cadena de texto' })
  @Length(2, 50, { message: 'La etiqueta debe tener entre 2 y 50 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  label?: string;

  @ApiPropertyOptional({
    description: 'Nombre de la persona que recibe el paquete en esta dirección',
    example: 'Carlos Gómez',
    maxLength: 150,
  })
  @IsOptional()
  @IsString({
    message: 'El nombre del destinatario debe ser una cadena de texto',
  })
  @MaxLength(150, {
    message: 'El nombre del destinatario no puede exceder los 150 caracteres',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  recipientName?: string;

  @ApiPropertyOptional({
    description:
      'Teléfono de contacto para la entrega. Acepta formato internacional (+503XXXXXXXX) o nacional de 8 dígitos iniciando en 2, 6 o 7.',
    example: '+50371234567',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.replace(/[^\d+]/g, '');
    if (/^\d{8}$/.test(cleaned)) {
      return `+503${cleaned}`;
    }
    return cleaned;
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Matches(/^\+503[267]\d{7}$/, {
    message:
      'El teléfono debe ser un número válido de El Salvador (+503XXXXXXXX donde el primer dígito es 2, 6 o 7)',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Ciudad de la dirección',
    example: 'San Salvador',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La ciudad no puede exceder los 100 caracteres' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city?: string;

  @ApiProperty({
    description: 'Dirección detallada (calle, pasaje, block, etc.)',
    example: 'Residencial San Francisco, Senda 3, Casa #14',
    minLength: 5,
    maxLength: 500,
  })
  @IsString({ message: 'La dirección detallada debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La dirección detallada es obligatoria' })
  @Length(5, 500, {
    message: 'La dirección detallada debe tener entre 5 y 500 caracteres',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  addressLine!: string;

  @ApiPropertyOptional({
    description:
      'Punto de referencia adicional para facilitar la entrega (ej: Frente al parque, portón negro)',
    example: 'Frente al parque comunal, casa con portón negro',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'La referencia debe ser una cadena de texto' })
  @MaxLength(255, {
    message: 'La referencia no puede exceder los 255 caracteres',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reference?: string;

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

  /**
   * Helper que retorna el nombre o alias resuelto de la dirección,
   * priorizando alias sobre label si ambos fueran provistos.
   */
  getResolvedLabel(): string {
    return (this.alias || this.label || '').trim();
  }
}
