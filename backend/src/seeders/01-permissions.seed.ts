// src/database/seeds/01-permissions.seed.ts
import { DataSource } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';

const PERMISSIONS = [
  // users
  { code: 'users:read',         description: 'Ver usuarios' },
  { code: 'users:create',       description: 'Crear usuarios' },
  { code: 'users:update',       description: 'Actualizar usuarios' },
  { code: 'users:delete',       description: 'Eliminar usuarios' },
  { code: 'users:assign-roles', description: 'Asignar roles a usuarios' },
  // roles
  { code: 'roles:read',         description: 'Ver roles' },
  { code: 'roles:create',       description: 'Crear roles' },
  { code: 'roles:update',       description: 'Actualizar roles' },
  { code: 'roles:delete',       description: 'Eliminar roles' },
  // suppliers
  { code: 'suppliers:read',     description: 'Ver proveedores' },
  { code: 'suppliers:create',   description: 'Crear proveedores' },
  { code: 'suppliers:update',   description: 'Actualizar proveedores' },
  { code: 'suppliers:delete',   description: 'Eliminar proveedores' },
  // purchases
  { code: 'purchases:read',     description: 'Ver compras' },
  { code: 'purchases:create',   description: 'Crear compras' },
  { code: 'purchases:update',   description: 'Actualizar compras' },
  { code: 'purchases:approve',  description: 'Aprobar compras' },
  { code: 'purchases:receive',  description: 'Recibir compras' },
  { code: 'purchases:delete',   description: 'Eliminar compras' },
  // products
  { code: 'products:read',      description: 'Ver productos' },
  { code: 'products:create',    description: 'Crear productos' },
  { code: 'products:update',    description: 'Actualizar productos' },
  { code: 'products:delete',    description: 'Eliminar productos' },
  // product-categories
  { code: 'product-categories:read',   description: 'Ver categorías' },
  { code: 'product-categories:create', description: 'Crear categorías' },
  { code: 'product-categories:update', description: 'Actualizar categorías' },
  { code: 'product-categories:delete', description: 'Eliminar categorías' },
  // inventory
  { code: 'inventory:read',     description: 'Ver inventario' },
  { code: 'inventory:adjust',   description: 'Ajustar stock manualmente' },
  // customers
  { code: 'customers:read',     description: 'Ver clientes' },
  { code: 'customers:create',   description: 'Crear clientes' },
  { code: 'customers:update',   description: 'Actualizar clientes' },
  { code: 'customers:delete',   description: 'Eliminar clientes' },
];

export async function seedPermissions(dataSource: DataSource): Promise<Permission[]> {
  const repo = dataSource.getRepository(Permission);

  for (const perm of PERMISSIONS) {
    const exists = await repo.findOne({ where: { code: perm.code } });
    if (!exists) {
      await repo.save(repo.create(perm));
    }
  }

  const all = await repo.find();
  console.log(`✓ Permisos: ${all.length} en total.`);
  return all;
}