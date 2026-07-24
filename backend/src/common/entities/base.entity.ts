import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Entidad base abstracta que toda tabla de negocio debe extender.
 * Provee: id (UUID), createdAt, updatedAt, deletedAt (Soft Delete).
 *
 * TDD § 3.1 — Convenciones generales de todas las tablas.
 */
export abstract class BaseEntity {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Identificador único UUID generado automáticamente',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '2026-07-20T10:00:00.000Z',
    description: 'Fecha y hora de creación del registro',
  })
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-07-20T10:00:00.000Z',
    description: 'Fecha y hora de la última modificación',
  })
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  updatedAt: Date;

  /**
   * Marca de borrado lógico (Soft Delete).
   * NULL = registro activo. Valor = registro eliminado.
   * TypeORM excluye automáticamente estos registros en find/findOne.
   * Se excluye de las respuestas JSON via @Exclude() + ClassSerializerInterceptor.
   */
  @Exclude()
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date | null;
}