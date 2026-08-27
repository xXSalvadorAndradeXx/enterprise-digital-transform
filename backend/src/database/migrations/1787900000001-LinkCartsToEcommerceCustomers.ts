import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkCartsToEcommerceCustomers1787900000001
  implements MigrationInterface
{
  name = 'LinkCartsToEcommerceCustomers1787900000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "carts"
      DROP CONSTRAINT IF EXISTS "FK_5a9dade7a4baafc128f8e0d8041"
    `);

    await queryRunner.query(`
      ALTER TABLE "carts"
      ADD CONSTRAINT "FK_carts_ecommerce_customer"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "carts"
      DROP CONSTRAINT IF EXISTS "FK_carts_ecommerce_customer"
    `);

    await queryRunner.query(`
      ALTER TABLE "carts"
      ADD CONSTRAINT "FK_5a9dade7a4baafc128f8e0d8041"
      FOREIGN KEY ("customer_id") REFERENCES "users"("id")
      ON DELETE SET NULL
    `);
  }
}
