import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartialIndexesToCustomers1786300000001 implements MigrationInterface {
  name = 'AddPartialIndexesToCustomers1786300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop standard unique constraints
    await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "UQ_customers_dui"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "UQ_customers_email"`);

    // 2. Create partial unique index on LOWER(email) for active (non-deleted) customers
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_customers_email_active"
      ON "customers" (LOWER("email"))
      WHERE "deleted_at" IS NULL
    `);

    // 3. Create partial unique index on dui for active (non-deleted) customers
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_customers_dui_active"
      ON "customers" ("dui")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop partial unique indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_email_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_dui_active"`);

    // 2. Restore standard unique constraints
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD CONSTRAINT "UQ_customers_dui" UNIQUE ("dui"),
      ADD CONSTRAINT "UQ_customers_email" UNIQUE ("email")
    `);
  }
}
