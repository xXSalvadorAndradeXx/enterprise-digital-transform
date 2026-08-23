  import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultAddressUniqueIndex1786300000004 implements MigrationInterface {
  name = 'AddDefaultAddressUniqueIndex1786300000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_customer_default_address"
      ON "customer_addresses" ("customer_id")
      WHERE "is_default" = true
        AND "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "uq_customer_default_address"
    `);
  }
}
