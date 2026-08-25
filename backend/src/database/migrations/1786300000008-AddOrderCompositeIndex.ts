import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderCompositeIndex1786300000008 implements MigrationInterface {
  name = 'AddOrderCompositeIndex1786300000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_customer_created" 
      ON "orders" ("customer_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_customer_created"`);
  }
}
