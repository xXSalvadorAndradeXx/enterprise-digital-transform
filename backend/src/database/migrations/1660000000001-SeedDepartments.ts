// src/database/migrations/1660000000001-SeedDepartments.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDepartments1660000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO departments (id, name, code, is_active, created_at, updated_at)
      VALUES 
        (uuid_generate_v4(), 'Ahuachapán',   '01', true, now(), now()),
        (uuid_generate_v4(), 'Cabañas',      '02', true, now(), now()),
        (uuid_generate_v4(), 'Chalatenango', '03', true, now(), now()),
        (uuid_generate_v4(), 'Cuscatlán',    '04', true, now(), now()),
        (uuid_generate_v4(), 'La Libertad',  '05', true, now(), now()),
        (uuid_generate_v4(), 'La Paz',       '06', true, now(), now()),
        (uuid_generate_v4(), 'La Unión',     '07', true, now(), now()),
        (uuid_generate_v4(), 'Morazán',      '08', true, now(), now()),
        (uuid_generate_v4(), 'San Miguel',   '09', true, now(), now()),
        (uuid_generate_v4(), 'San Salvador', '10', true, now(), now()),
        (uuid_generate_v4(), 'San Vicente',  '11', true, now(), now()),
        (uuid_generate_v4(), 'Santa Ana',    '12', true, now(), now()),
        (uuid_generate_v4(), 'Sonsonate',    '13', true, now(), now()),
        (uuid_generate_v4(), 'Usulután',     '14', true, now(), now())
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM districts WHERE department_id IN (SELECT id FROM departments WHERE code IN ('01','02','03','04','05','06','07','08','09','10','11','12','13','14'));
    `);
    await queryRunner.query(`
      DELETE FROM departments WHERE code IN ('01','02','03','04','05','06','07','08','09','10','11','12','13','14');
    `);
  }
}
