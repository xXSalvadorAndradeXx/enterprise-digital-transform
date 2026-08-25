import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminCustomerIndexes1786300000006 implements MigrationInterface {
  name = 'AddAdminCustomerIndexes1786300000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Índice parcial para ordenar/filtrar por fecha de última orden
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customers_last_order_at"
      ON "customers" ("last_order_at")
      WHERE "deleted_at" IS NULL
    `);

    // 2. Índice parcial para ordenar por total gastado
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customers_total_spent"
      ON "customers" ("total_spent")
      WHERE "deleted_at" IS NULL
    `);

    // 3. Índice parcial para ordenar por total de órdenes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customers_total_orders"
      ON "customers" ("total_orders")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_total_orders"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_total_spent"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_last_order_at"`);
  }
}
