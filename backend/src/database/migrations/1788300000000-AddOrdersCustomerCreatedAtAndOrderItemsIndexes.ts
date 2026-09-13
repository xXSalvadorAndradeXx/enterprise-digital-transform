import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrdersCustomerCreatedAtAndOrderItemsIndexes1788300000000
  implements MigrationInterface
{
  name = 'AddOrdersCustomerCreatedAtAndOrderItemsIndexes1788300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_customer_created_at"
      ON "orders" ("customer_id", "created_at" DESC)
      WHERE "customer_id" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_order_items_order_id"
      ON "order_items" ("orderId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_order_items_order_id";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_orders_customer_created_at";
    `);
  }
}
