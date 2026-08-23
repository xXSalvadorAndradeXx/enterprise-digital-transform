import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCheckConstraintsToCustomers1786300000002 implements MigrationInterface {
  name = 'AddCheckConstraintsToCustomers1786300000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD CONSTRAINT "CHK_customers_total_spent_non_negative" CHECK (total_spent >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "customers"
      ADD CONSTRAINT "CHK_customers_total_orders_non_negative" CHECK (total_orders >= 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP CONSTRAINT IF EXISTS "CHK_customers_total_spent_non_negative"
    `);

    await queryRunner.query(`
      ALTER TABLE "customers"
      DROP CONSTRAINT IF EXISTS "CHK_customers_total_orders_non_negative"
    `);
  }
}
