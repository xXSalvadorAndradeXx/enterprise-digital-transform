// src/database/migrations/1737300005000-CreateSuppliersTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuppliersTable1737300005000 implements MigrationInterface {
  name = 'CreateSuppliersTable1737300005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "suppliers" (
        "id"           UUID          NOT NULL DEFAULT uuid_generate_v4(),
        "name"         VARCHAR(150)  NOT NULL,
        "tax_id"       VARCHAR(20)   NULL,
        "email"        VARCHAR(150)  NULL,
        "phone"        VARCHAR(30)   NULL,
        "address"      VARCHAR(255)  NULL,
        "contact_name" VARCHAR(100)  NULL,
        "notes"        TEXT          NULL,
        "is_active"    BOOLEAN       NOT NULL DEFAULT true,
        "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "deleted_at"   TIMESTAMPTZ   NULL,
        CONSTRAINT "PK_suppliers_id"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_suppliers_tax_id"  UNIQUE ("tax_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_suppliers_name"
        ON "suppliers" (LOWER("name"))
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "suppliers" IS
      'Proveedores del ERP. tax_id = NIT/NRC/RUC según país.'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_suppliers_name"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);
  }
}