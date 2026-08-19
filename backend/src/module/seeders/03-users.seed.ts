// src/database/seeds/03-users.seed.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

interface SeedUser {
  firstName:  string;
  lastName:   string;
  email:      string;
  passwordEnv: string;
  defaultPwd: string;
  roleName:   string;
}

const SEED_USERS: SeedUser[] = [
  {
    firstName:   'Admin',
    lastName:    'ERP',
    email:       process.env.SEED_ADMIN_EMAIL    ?? 'admin@erp.local',
    passwordEnv: process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!',
    defaultPwd:  'Admin1234!',
    roleName:    'ADMIN',
  },
  {
    firstName:   'Empleado',
    lastName:    'ERP',
    email:       process.env.SEED_EMPLEADO_EMAIL    ?? 'empleado@erp.local',
    passwordEnv: process.env.SEED_EMPLEADO_PASSWORD ?? 'Empleado1234!',
    defaultPwd:  'Empleado1234!',
    roleName:    'EMPLEADO',
  },
];

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);

  for (const seed of SEED_USERS) {
    const existing = await userRepo.findOne({ where: { email: seed.email } });
    if (existing) {
      console.log(`✓ Usuario ${seed.email} ya existe — omitiendo.`);
      continue;
    }

    const role = await roleRepo.findOne({ where: { name: seed.roleName } });
    if (!role) {
      throw new Error(`Rol ${seed.roleName} no encontrado. Ejecuta el seed de roles primero.`);
    }

    const passwordHash = await bcrypt.hash(seed.passwordEnv, 12);

    await userRepo.save(
      userRepo.create({
        firstName:          seed.firstName,
        lastName:           seed.lastName,
        email:              seed.email,
        passwordHash,
        mustChangePassword: false,
        isActive:           true,
        roles:              [role],
      }),
    );

    console.log(`✓ Usuario ${seed.email} creado con rol ${seed.roleName}.`);
  }
}