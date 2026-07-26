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

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepo = dataSource.getRepository(Role);
  const permRepo = dataSource.getRepository(Permission);

  const allPermissions     = await permRepo.find();
  const empleadoPerms      = allPermissions.filter((p) =>
    EMPLEADO_PERMISSIONS.includes(p.code),
  );

  // ── Rol ADMIN ────────────────────────────────────────────────────────
  const existingAdmin = await roleRepo.findOne({ where: { name: 'ADMIN' } });
  if (!existingAdmin) {
    await roleRepo.save(
      roleRepo.create({
        name:        'ADMIN',
        description: 'Acceso total al sistema.',
        isSystem:    true,
        permissions: allPermissions,
      }),
    );
    console.log('✓ Rol ADMIN creado.');
  } else {
    console.log('✓ Rol ADMIN ya existe — omitiendo.');
  }

  // ── Rol EMPLEADO ─────────────────────────────────────────────────────
  const existingEmpleado = await roleRepo.findOne({ where: { name: 'EMPLEADO' } });
  if (!existingEmpleado) {
    await roleRepo.save(
      roleRepo.create({
        name:        'EMPLEADO',
        description: 'Acceso operativo básico.',
        isSystem:    false,
        permissions: empleadoPerms,
      }),
    );
    console.log('✓ Rol EMPLEADO creado.');
  } else {
    console.log('✓ Rol EMPLEADO ya existe — omitiendo.');
  }
}