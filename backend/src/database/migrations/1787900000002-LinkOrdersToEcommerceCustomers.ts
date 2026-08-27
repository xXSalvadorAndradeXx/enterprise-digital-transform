import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkOrdersToEcommerceCustomers1787900000002
  implements MigrationInterface
{
  name = 'LinkOrdersToEcommerceCustomers1787900000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Las órdenes históricas conservan sus snapshots aunque su antiguo usuario
    // ERP no tenga un Customer equivalente.
    await queryRunner.query(`
      UPDATE "orders" AS "order"
      SET "customer_id" = NULL
      WHERE "customer_id" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "customers" AS "customer"
          WHERE "customer"."id" = "order"."customer_id"
        )
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP CONSTRAINT IF EXISTS "FK_orders_customer"
    `);

    // TypeORM puede haber generado un nombre hash distinto para la misma FK.
    // Se elimina cualquier relación residual orders -> users sin depender
    // del nombre concreto de la restricción.
    await queryRunner.query(`
      DO $migration$
      DECLARE foreign_key record;
      BEGIN
        FOR foreign_key IN
          SELECT "conname"
          FROM "pg_constraint"
          WHERE "conrelid" = 'orders'::regclass
            AND "confrelid" = 'users'::regclass
            AND "contype" = 'f'
        LOOP
          EXECUTE format(
            'ALTER TABLE "orders" DROP CONSTRAINT %I',
            foreign_key."conname"
          );
        END LOOP;
      END
      $migration$;
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_orders_ecommerce_customer"
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP CONSTRAINT IF EXISTS "FK_orders_ecommerce_customer"
    `);

    await queryRunner.query(`
      UPDATE "orders" AS "order"
      SET "customer_id" = NULL
      WHERE "customer_id" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "users" AS "user"
          WHERE "user"."id" = "order"."customer_id"
        )
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_orders_customer"
      FOREIGN KEY ("customer_id") REFERENCES "users"("id")
      ON DELETE SET NULL
    `);
  }
}
