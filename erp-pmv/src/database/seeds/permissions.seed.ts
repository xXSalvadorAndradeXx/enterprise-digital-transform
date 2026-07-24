import { DataSource } from 'typeorm';
import { Permission } from '../../modules/permissions/dto/permission.entity';
import { Logger } from '@nestjs/common';

const logger = new Logger('PermissionsSeed');

/**
 * Definición completa de todos los permisos del ERP PMV.
 * TDD § 4 Módulo Equipo — Convención recurso:accion.
 *
 * Incluye permisos para los 7 módulos del PMV más los permisos
 * administrativos (users, roles, permissions).
 */
export const ALL_PERMISSIONS: Array<{ code: string; description: string }> = [
  // ── Autenticación ──────────────────────────────────────────────────
  // (No hay permisos específicos; los endpoints de auth son públicos
  //  o usan JwtAuthGuard directamente sin permiso adicional)

  // ── Usuarios ───────────────────────────────────────────────────────
  { code: 'users:read',         description: 'Ver listado y detalle de usuarios' },
  { code: 'users:create',       description: 'Crear nuevos usuarios del sistema' },
  { code: 'users:update',       description: 'Editar datos de usuarios existentes' },
  { code: 'users:delete',       description: 'Eliminar (soft delete) usuarios' },
  { code: 'users:assign-roles', description: 'Reasignar roles a un usuario' },

  // ── Roles ──────────────────────────────────────────────────────────
  { code: 'roles:read',         description: 'Ver listado y detalle de roles' },
  { code: 'roles:create',       description: 'Crear nuevos roles' },
  { code: 'roles:update',       description: 'Editar nombre, descripción y permisos de un rol' },
  { code: 'roles:delete',       description: 'Eliminar (soft delete) roles no-sistema' },

  // ── Proveedores ────────────────────────────────────────────────────
  { code: 'suppliers:read',     description: 'Ver listado y detalle de proveedores' },
  { code: 'suppliers:create',   description: 'Crear nuevos proveedores' },
  { code: 'suppliers:update',   description: 'Editar datos de proveedores existentes' },
  { code: 'suppliers:delete',   description: 'Eliminar (soft delete) proveedores sin compras activas' },

  // ── Compras a Proveedores ──────────────────────────────────────────
  { code: 'purchases:read',          description: 'Ver listado, detalle e historial de compras' },
  { code: 'purchases:create',        description: 'Registrar nuevas órdenes de compra' },
  { code: 'purchases:update',        description: 'Editar líneas de compras en estado Pendiente' },
  { code: 'purchases:change-status', description: 'Transicionar estado de una compra (Recibida/Cancelada)' },

  // ── Productos ──────────────────────────────────────────────────────
  { code: 'products:read',     description: 'Ver listado y detalle de productos' },
  { code: 'products:create',   description: 'Crear nuevos productos en el catálogo' },
  { code: 'products:update',   description: 'Editar datos de productos existentes' },
  { code: 'products:delete',   description: 'Eliminar (soft delete) productos sin movimientos asociados' },

  // ── Categorías de Productos ────────────────────────────────────────
  { code: 'product-categories:read',   description: 'Ver listado y detalle de categorías de productos' },
  { code: 'product-categories:create', description: 'Crear nuevas categorías de productos' },
  { code: 'product-categories:update', description: 'Editar categorías de productos existentes' },
  { code: 'product-categories:delete', description: 'Eliminar (soft delete) categorías sin productos asociados' },

  // ── Inventario ─────────────────────────────────────────────────────
  { code: 'inventory:read',   description: 'Ver historial de movimientos y stock actual' },
  { code: 'inventory:adjust', description: 'Realizar ajustes manuales de inventario (requiere comentario)' },

  // ── Clientes ───────────────────────────────────────────────────────
  { code: 'customers:read',   description: 'Ver listado y detalle de clientes' },
  { code: 'customers:create', description: 'Crear nuevos clientes' },
  { code: 'customers:update', description: 'Editar datos de clientes existentes' },
  { code: 'customers:delete', description: 'Eliminar (soft delete) clientes' },
];

/**
 * Ejecuta el seed de permisos usando INSERT ... ON CONFLICT DO NOTHING
 * para ser idempotente: correr el seed múltiples veces no duplica permisos.
 */
export async function runPermissionsSeed(dataSource: DataSource): Promise<void> {
  const permissionRepository = dataSource.getRepository(Permission);

  logger.log(`Sembrando ${ALL_PERMISSIONS.length} permisos...`);

  let created = 0;
  let skipped = 0;

  for (const permData of ALL_PERMISSIONS) {
    const existing = await permissionRepository.findOne({
      where: { code: permData.code },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const permission = permissionRepository.create(permData);
    await permissionRepository.save(permission);
    created++;
  }

  logger.log(
    `Permisos sembrados: ${created} creados, ${skipped} ya existían.`,
  );
}