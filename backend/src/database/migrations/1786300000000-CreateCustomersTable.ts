import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomersTable1786300000000 implements MigrationInterface {
  name = 'CreateCustomersTable1786300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "full_name" character varying(150) NOT NULL,
        "dui" character varying(20) NOT NULL,
        "email" character varying(150) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "last_order_at" TIMESTAMP WITH TIME ZONE,
        "total_spent" numeric(10,2) NOT NULL DEFAULT 0.00,
        "total_orders" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_customers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_customers_dui" UNIQUE ("dui"),
        CONSTRAINT "UQ_customers_email" UNIQUE ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
  }
}
