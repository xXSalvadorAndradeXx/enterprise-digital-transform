import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeparateEcommerceCustomerAddresses1787900000000
  implements MigrationInterface
{
  name = 'SeparateEcommerceCustomerAddresses1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ecommerce_customer_addresses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "department_id" integer NOT NULL,
        "district_id" integer NOT NULL,
        "city" character varying(100),
        "address_line" text NOT NULL,
        "label" character varying(50) NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_ecommerce_customer_addresses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ecommerce_customer_addresses_customer"
          FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_ecommerce_customer_addresses_department"
          FOREIGN KEY ("department_id") REFERENCES "departments"("id")
          ON DELETE RESTRICT,
        CONSTRAINT "FK_ecommerce_customer_addresses_district"
          FOREIGN KEY ("district_id") REFERENCES "districts"("id")
          ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ecommerce_customer_addresses_customer"
      ON "ecommerce_customer_addresses" ("customer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ecommerce_customer_addresses_location"
      ON "ecommerce_customer_addresses" ("department_id", "district_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ecommerce_customer_addresses_location"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ecommerce_customer_addresses_customer"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "ecommerce_customer_addresses"`,
    );
  }
}
