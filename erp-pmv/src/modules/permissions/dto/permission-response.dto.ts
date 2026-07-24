import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para un permiso individual.
 * Usado en listados y en la respuesta de roles con sus permisos.
 */
export class PermissionResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'products:create' })
  code: string;

  @ApiProperty({
    example: 'Permite crear nuevos productos en el catálogo',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: '2026-07-20T10:00:00.000Z' })
  createdAt: Date;
}