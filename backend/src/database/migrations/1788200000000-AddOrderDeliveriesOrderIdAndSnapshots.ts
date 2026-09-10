import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderDeliveriesOrderIdAndSnapshots1788200000000 implements MigrationInterface {
  name = 'AddOrderDeliveriesOrderIdAndSnapshots1788200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "order_deliveries_delivery_type_enum" AS ENUM('HOME_DELIVERY', 'STORE_PICKUP');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "order_deliveries"
      ADD COLUMN IF NOT EXISTS "order_id" uuid,
      ADD COLUMN IF NOT EXISTS "delivery_type" "order_deliveries_delivery_type_enum" DEFAULT 'HOME_DELIVERY',
      ADD COLUMN IF NOT EXISTS "department_id" character varying(50),
      ADD COLUMN IF NOT EXISTS "district_id" character varying(50),
      ADD COLUMN IF NOT EXISTS "department_name" character varying(100),
      ADD COLUMN IF NOT EXISTS "district_name" character varying(100),
      ADD COLUMN IF NOT EXISTS "shipping_total" numeric(12,2) NOT NULL DEFAULT '0.00';
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_order_deliveries_order_id" ON "order_deliveries" ("order_id");
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "order_deliveries"
        ADD CONSTRAINT "FK_order_deliveries_order"
        FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_deliveries"
      DROP CONSTRAINT IF EXISTS "FK_order_deliveries_order";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_order_deliveries_order_id";
    `);

    await queryRunner.query(`
      ALTER TABLE "order_deliveries"
      DROP COLUMN IF EXISTS "shipping_total",
      DROP COLUMN IF EXISTS "district_name",
      DROP COLUMN IF EXISTS "department_name",
      DROP COLUMN IF EXISTS "district_id",
      DROP COLUMN IF EXISTS "department_id",
      DROP COLUMN IF EXISTS "delivery_type",
      DROP COLUMN IF EXISTS "order_id";
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "order_deliveries_delivery_type_enum";
    `);
  }
}
