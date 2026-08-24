import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEcommerceAuthSessionsTable1786300000005 implements MigrationInterface {
  name = 'CreateEcommerceAuthSessionsTable1786300000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
        CONSTRAINT "PK_ecommerce_auth_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ecommerce_auth_sessions_customer" 
          FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ecommerce_auth_sessions_customer_id" ON "ecommerce_auth_sessions" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ecommerce_auth_sessions_expires_at" ON "ecommerce_auth_sessions" ("expires_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ecommerce_auth_sessions_revoked_at" ON "ecommerce_auth_sessions" ("revoked_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ecommerce_auth_sessions_revoked_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ecommerce_auth_sessions_expires_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ecommerce_auth_sessions_customer_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ecommerce_auth_sessions"`);
  }
}
