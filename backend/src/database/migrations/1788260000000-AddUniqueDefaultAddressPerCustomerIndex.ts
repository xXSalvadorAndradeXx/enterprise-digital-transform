import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueDefaultAddressPerCustomerIndex1788260000000
  implements MigrationInterface
{
  name = 'AddUniqueDefaultAddressPerCustomerIndex1788260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_unique_default_address_per_customer"
      ON "ecommerce_customer_addresses" ("customer_id")
      WHERE ("is_default" = true AND "deleted_at" IS NULL);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_unique_default_address_per_customer";
    `);
  }
}
