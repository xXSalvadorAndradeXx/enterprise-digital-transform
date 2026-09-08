import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingOrderColumns1788100000000 implements MigrationInterface {
  name = 'AddMissingOrderColumns1788100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "payment_deadline" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "guest_order_access_token_hash" character varying(64),
      ADD COLUMN IF NOT EXISTS "customer_metrics_counted_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "contact_snapshot" jsonb;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "contact_snapshot",
      DROP COLUMN IF EXISTS "customer_metrics_counted_at",
      DROP COLUMN IF EXISTS "guest_order_access_token_hash",
      DROP COLUMN IF EXISTS "payment_deadline";
    `);
  }
}
