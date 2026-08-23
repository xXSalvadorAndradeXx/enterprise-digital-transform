import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerAddressesTable1786300000003 implements MigrationInterface {
  name = 'CreateCustomerAddressesTable1786300000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_addresses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "department_id" uuid NOT NULL,
        "district_id" uuid NOT NULL,
        "city" character varying(100),
        "address_line" text NOT NULL,
        "label" character varying(50) NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_customer_addresses_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_customer_addresses_customer" 
          FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_customer_addresses_department" 
          FOREIGN KEY ("department_id") REFERENCES "departments" ("id") 
          ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_customer_addresses_district" 
          FOREIGN KEY ("district_id") REFERENCES "districts" ("id") 
          ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_addresses_customer_id" ON "customer_addresses" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_addresses_department_id" ON "customer_addresses" ("department_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customer_addresses_district_id" ON "customer_addresses" ("district_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_addresses_district_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_addresses_department_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customer_addresses_customer_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_addresses"`);
  }
}
