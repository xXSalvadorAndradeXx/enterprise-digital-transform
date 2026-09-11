import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomersAndEcommerceAuthSessions1787850000000 implements MigrationInterface {
  name = 'CreateCustomersAndEcommerceAuthSessions1787850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
        CONSTRAINT "PK_customers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_customers_dui" UNIQUE ("dui"),
        CONSTRAINT "UQ_customers_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ecommerce_auth_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "refresh_token_hash" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "user_agent" text,
        "ip_hash" character varying(64),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ecommerce_auth_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ecommerce_auth_sessions_customer"
          FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ecommerce_auth_sessions_customer_id"
      ON "ecommerce_auth_sessions" ("customer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ecommerce_auth_sessions_expires_at"
      ON "ecommerce_auth_sessions" ("expires_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ecommerce_auth_sessions_revoked_at"
      ON "ecommerce_auth_sessions" ("revoked_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ecommerce_auth_sessions_revoked_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ecommerce_auth_sessions_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_ecommerce_auth_sessions_customer_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "ecommerce_auth_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
  }
}
