import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entidad Permission — unidad atómica de autorización.
 * TDD § 3 Tabla: permissions
 *
 * NOTA: Esta entidad NO extiende BaseEntity porque:
 * - No tiene updated_at (los permisos son inmutables una vez creados)
 * - No tiene deleted_at (no se hace soft delete de permisos; son del sistema)
 * - Solo tiene id, code, description, created_at
 *
 * Los permisos siguen la convención: recurso:accion
 * Ejemplos: products:create, purchases:approve, inventory:adjust
 */
@Entity('permissions')
export class Permission {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890',
    description: 'Identificador único UUID',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'products:create',
    description: 'Código único del permiso en formato recurso:accion',
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @ApiProperty({
    example: 'Permite crear nuevos productos en el catálogo',
    description: 'Descripción legible del permiso',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @ApiProperty({ example: '2026-07-20T10:00:00.000Z' })
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;
}