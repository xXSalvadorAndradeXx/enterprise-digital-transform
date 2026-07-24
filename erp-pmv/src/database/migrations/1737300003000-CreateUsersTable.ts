// src/database/migrations/1737300003000-CreateUsersTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1737300003000 implements MigrationInterface {
  name = 'CreateUsersTable1737300003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                    UUID          NOT NULL DEFAULT uuid_generate_v4(),
        "first_name"            VARCHAR(100)  NOT NULL,
        "last_name"             VARCHAR(100)  NOT NULL,
        "email"                 VARCHAR(150)  NOT NULL,
        "password_hash"         VARCHAR(255)  NOT NULL,
        "is_active"             BOOLEAN       NOT NULL DEFAULT true,
        "must_change_password"  BOOLEAN       NOT NULL DEFAULT true,
        "failed_login_attempts" SMALLINT      NOT NULL DEFAULT 0,
        "locked_until"          TIMESTAMPTZ   NULL,
        "created_at"            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "deleted_at"            TIMESTAMPTZ   NULL,
        CONSTRAINT "PK_users_id"    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "users" IS
      'Colaboradores con acceso al back-office del ERP.'
    `);

    // Tabla pivote user_roles
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" UUID NOT NULL,
        "role_id" UUID NOT NULL,
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "FK_user_roles_user"
          FOREIGN KEY ("user_id")
          REFERENCES "users" ("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_role"
          FOREIGN KEY ("role_id")
          REFERENCES "roles" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_roles_user_id"
        ON "user_roles" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_roles_role_id"
        ON "user_roles" ("role_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_roles_role_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_roles_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}