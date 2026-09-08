import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO de respuesta para el perfil del cliente (E-Commerce / Pantalla Cuenta).
 * Expone únicamente los datos indispensables requeridos para la vista privada del cliente.
 */
export class CustomerProfileResponseDto {
  @ApiProperty({
    description: 'Identificador único del cliente (UUID versión 4)',
    example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec1',
    format: 'uuid',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Nombre del cliente para visualización en la interfaz de Cuenta',
    example: 'Carlos Eduardo Gómez',
  })
  @Expose()
  name!: string;

  @ApiPropertyOptional({
    description: 'Nombre completo registrado (alias para compatibilidad directa con contratos que esperan fullName)',
    example: 'Carlos Eduardo Gómez',
  })
  @Expose()
  fullName?: string;

  @ApiProperty({
    description: 'Correo electrónico registrado del cliente (solo lectura)',
    example: 'carlos.gomez@correo.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'Número de teléfono de contacto salvadoreño (+503XXXXXXXX)',
    example: '+50371234567',
  })
  @Expose()
  phone!: string;

  @ApiPropertyOptional({
    description: 'Documento Único de Identidad (DUI) salvadoreño (XXXXXXXX-X), o null si no fue provisto',
    example: '01234567-8',
    nullable: true,
  })
  @Expose()
  dui?: string | null;

  @ApiPropertyOptional({
    description: 'Rol del cliente en el portal (por defecto "cliente")',
    example: 'cliente',
  })
  @Expose()
  role?: string;

  @ApiPropertyOptional({
    description: 'Fecha de registro de la cuenta en formato ISO 8601, o null si no está disponible',
    example: '2026-08-26T19:53:00.000Z',
    nullable: true,
  })
  @Expose()
  createdAt?: Date | string | null;
}
