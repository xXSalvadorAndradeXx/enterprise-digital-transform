import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTable1786300000007 implements MigrationInterface {
  name = 'CreateOrdersTable1786300000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_number" character varying(50) NOT NULL,
        "total" numeric(10,2) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'PENDING',
        "delivery_type" character varying(50) NOT NULL DEFAULT 'HOME_DELIVERY',
        "total_items" integer NOT NULL DEFAULT 1,
        "customer_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_orders_order_number" UNIQUE ("order_number"),
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_customer_id" FOREIGN KEY ("customer_id") 
          REFERENCES "customers"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_customer_id" ON "orders" ("customer_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_customer_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
  }
}
