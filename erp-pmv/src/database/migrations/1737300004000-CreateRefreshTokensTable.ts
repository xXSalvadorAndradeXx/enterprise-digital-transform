// src/database/migrations/1737300004000-CreateRefreshTokensTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokensTable1737300004000 implements MigrationInterface {
  name = 'CreateRefreshTokensTable1737300004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"          UUID          NOT NULL DEFAULT uuid_generate_v4(),
        "token_hash"  VARCHAR(255)  NOT NULL,
        "expires_at"  TIMESTAMPTZ   NOT NULL,
        "is_revoked"  BOOLEAN       NOT NULL DEFAULT false,
        "user_agent"  VARCHAR(255)  NULL,
        "ip_address"  VARCHAR(45)   NULL,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "user_id"     UUID          NOT NULL,
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_user_id"
        ON "refresh_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_token_hash"
        ON "refresh_tokens" ("token_hash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_token_hash"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}