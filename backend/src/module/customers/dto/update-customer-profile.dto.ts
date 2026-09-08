import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para la actualización del perfil del cliente comprador.
 * Restringido estrictamente a datos editables (name / phone).
 * El campo email queda intencionalmente excluido para evitar mutación no autorizada de credenciales.
 */
export class UpdateCustomerProfileDto {
  @ApiPropertyOptional({
    description:
      'Nombre a actualizar (mínimo 3 y máximo 150 caracteres; no puede estar vacío ni compuesto solo por espacios)',
    example: 'Carlos Eduardo Gómez',
    minLength: 3,
    maxLength: 150,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({
    message:
      'El nombre no puede estar vacío ni compuesto únicamente por espacios',
  })
  @Length(3, 150, { message: 'El nombre debe tener entre 3 y 150 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    description:
      'Nombre completo (alias aceptado para compatibilidad con contratos que envíen fullName)',
    example: 'Carlos Eduardo Gómez',
    minLength: 3,
    maxLength: 150,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @IsNotEmpty({
    message:
      'El nombre completo no puede estar vacío ni compuesto únicamente por espacios',
  })
  @Length(3, 150, {
    message: 'El nombre completo debe tener entre 3 y 150 caracteres',
  })
  fullName?: string;

  @ApiPropertyOptional({
    description:
      'Número de teléfono de contacto en El Salvador. Acepta formato internacional (+503XXXXXXXX) o nacional de 8 dígitos iniciando en 2, 6 o 7.',
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
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  @Matches(/^\+503[267]\d{7}$/, {
    message:
      'El teléfono debe ser un número válido de El Salvador (+503XXXXXXXX donde el primer dígito es 2, 6 o 7)',
  })
  phone?: string;

  /**
   * Helper que retorna el nombre provisto, priorizando `name` sobre `fullName`.
   */
  getResolvedName(): string | undefined {
    return this.name ?? this.fullName;
  }
}
