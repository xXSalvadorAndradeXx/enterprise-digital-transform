// src/database/seeds/index.ts
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import dataSource from '../../database/data-source';
import { seedPermissions } from './01-permissions.seed';
import { seedRoles }       from './02-roles.seed';
import { seedUsers }       from './03-users.seed';

async function run(): Promise<void> {
  console.log('🔌 Conectando a la base de datos...');
  await dataSource.initialize();
  console.log('✅ Conexión establecida.\n');

  console.log('🌱 Iniciando seeds...\n');

  await seedPermissions(dataSource);
  await seedRoles(dataSource);
  await seedUsers(dataSource);

  console.log('\n✅ Seeds completados exitosamente.');
  await dataSource.destroy();
}

run().catch((err) => {
  console.error('\n❌ Error ejecutando seeds:', err);
  process.exit(1);
});