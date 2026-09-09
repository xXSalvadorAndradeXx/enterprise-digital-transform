import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerNotificationsTable1788400000000
  implements MigrationInterface
{
  name = 'CreateCustomerNotificationsTable1788400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enum de tipos de notificación
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "customer_notifications_type_enum" AS ENUM(
          'ORDER_STATUS_CHANGED',
          'FAVORITE_PRICE_DROPPED',
          'SYSTEM_ANNOUNCEMENT'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Tabla de notificaciones del cliente
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "order_id" uuid,
        "product_id" uuid,
        "type" "customer_notifications_type_enum" NOT NULL DEFAULT 'SYSTEM_ANNOUNCEMENT',
        "title" character varying(150) NOT NULL,
        "message" text NOT NULL,
        "metadata" jsonb,
        "action_url" character varying(255),
        "is_read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_customer_notifications_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_customer_notifications_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_customer_notifications_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL
      );
    `);

    // 3. Índices de optimización
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_notifications_customer_created"
      ON "customer_notifications" ("customer_id", "created_at" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_notifications_customer_unread"
      ON "customer_notifications" ("customer_id", "is_read")
      WHERE "is_read" = false;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_notifications_order_id"
      ON "customer_notifications" ("order_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_notifications_product_id"
      ON "customer_notifications" ("product_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "customer_notifications";
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "customer_notifications_type_enum";
    `);
  }
}
