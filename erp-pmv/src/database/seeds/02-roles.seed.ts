// src/database/seeds/02-roles.seed.ts
import { DataSource } from 'typeorm';
import { Role } from '../../modules/roles/entities/role.entity';
import { Permission } from '../../modules/permissions/dto/permission.entity';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepo       = dataSource.getRepository(Role);
  const permissionRepo = dataSource.getRepository(Permission);

  // Traer todos los permisos sembrados en el paso 4
  const allPermissions = await permissionRepo.find();

  if (allPermissions.length === 0) {
    throw new Error('Seed de permisos debe ejecutarse antes que el de roles.');
  }

  const existing = await roleRepo.findOne({ where: { name: 'SUPERADMIN' } });
  if (existing) {
    console.log('✓ Rol SUPERADMIN ya existe — omitiendo.');
    return;
  }

  const superadmin = roleRepo.create({
    name:        'SUPERADMIN',
    description: 'Acceso total al sistema. Rol de sistema no editable.',
    isSystem:    true,
    permissions: allPermissions, // asigna los 30 permisos
  });

  await roleRepo.save(superadmin);
  console.log(`✓ Rol SUPERADMIN creado con ${allPermissions.length} permisos.`);
}