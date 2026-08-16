// src/database/seeds/02-roles.seed.ts
import { DataSource } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

// Permisos que tendrá el rol EMPLEADO
const EMPLEADO_PERMISSIONS = [
  'users:read',
  'roles:read',
  'suppliers:read',
  'purchases:read',
  'purchases:create',
  'purchases:update',
  'products:read',
  'product-categories:read',
  'inventory:read',
  'customers:read',
  'customers:create',
  'customers:update',
];

// Permisos que tendrá el rol VENDEDOR
const VENDEDOR_PERMISSIONS = [
  'products:read',
  'product-categories:read',
  'inventory:read',
  'customers:read',
  'customers:create',
  'customers:update',
];

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepo = dataSource.getRepository(Role);
  const permRepo = dataSource.getRepository(Permission);

  const allPermissions = await permRepo.find();
  const empleadoPerms = allPermissions.filter((p) =>
    EMPLEADO_PERMISSIONS.includes(p.code),
  );
  const vendedorPerms = allPermissions.filter((p) =>
    VENDEDOR_PERMISSIONS.includes(p.code),
  );

  // ── Rol ADMIN ────────────────────────────────────────────────────────
  let admin = await roleRepo.findOne({ where: { name: 'ADMIN' }, relations: ['permissions'] });
  if (!admin) {
    admin = roleRepo.create({
      name: 'ADMIN',
      description: 'Acceso total al sistema.',
      isSystem: true,
    });
  }
  admin.permissions = allPermissions;
  await roleRepo.save(admin);
  console.log('✓ Rol ADMIN sincronizado con todos los permisos (incluye products:create, products:read, products:update, products:delete).');

  // ── Rol EMPLEADO ─────────────────────────────────────────────────────
  let empleado = await roleRepo.findOne({ where: { name: 'EMPLEADO' }, relations: ['permissions'] });
  if (!empleado) {
    empleado = roleRepo.create({
      name: 'EMPLEADO',
      description: 'Acceso operativo básico.',
      isSystem: false,
    });
  }
  empleado.permissions = empleadoPerms;
  await roleRepo.save(empleado);
  console.log('✓ Rol EMPLEADO sincronizado con permisos operativos.');

  // ── Rol VENDEDOR ─────────────────────────────────────────────────────
  let vendedor = await roleRepo.findOne({ where: { name: 'VENDEDOR' }, relations: ['permissions'] });
  if (!vendedor) {
    vendedor = roleRepo.create({
      name: 'VENDEDOR',
      description: 'Acceso a catálogo, ventas e inventario.',
      isSystem: false,
    });
  }
  vendedor.permissions = vendedorPerms;
  await roleRepo.save(vendedor);
  console.log('✓ Rol VENDEDOR sincronizado con permisos.');

  // ── Rol VIEWER (Si existe) ───────────────────────────────────────────
  let viewer = await roleRepo.findOne({ where: { name: 'VIEWER' }, relations: ['permissions'] });
  if (viewer) {
    const viewerPerms = allPermissions.filter((p) => p.code === 'products:read');
    viewer.permissions = viewerPerms;
    await roleRepo.save(viewer);
    console.log('✓ Rol VIEWER sincronizado únicamente con permiso products:read.');
  }
}