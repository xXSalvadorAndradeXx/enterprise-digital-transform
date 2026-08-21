// src/migrations/1724097600000-AddTypeToSupplierPurchases.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeToSupplierPurchases1724097600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE supplier_purchases
      ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE supplier_purchases
      DROP COLUMN IF EXISTS type
    `);
  }
}