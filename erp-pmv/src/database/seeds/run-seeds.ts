import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../data-source';
import { Logger } from '@nestjs/common';
import { runPermissionsSeed } from './permissions.seed';

const logger = new Logger('Seeds');

async function runSeeds(): Promise<void> {
  logger.log('Inicializando DataSource para seeds...');
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  try {
    logger.log('=== Ejecutando seeds ===');
    await runPermissionsSeed(dataSource);
    // Los siguientes seeds se agregarán en sus pasos correspondientes:
    // await runRolesSeed(dataSource);
    // await runSuperAdminSeed(dataSource);
    logger.log('=== Seeds completados correctamente ===');
  } catch (error) {
    logger.error('Error ejecutando seeds:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    logger.log('DataSource cerrado.');
  }
}

runSeeds().catch((err) => {
  console.error(err);
  process.exit(1);
});