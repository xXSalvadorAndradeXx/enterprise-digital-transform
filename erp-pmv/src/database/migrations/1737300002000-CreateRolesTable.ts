// src/database/migrations/1737300002000-CreateRolesTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolesTable1737300002000 implements MigrationInterface {
  name = 'CreateRolesTable1737300002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla roles
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"          UUID          NOT NULL DEFAULT uuid_generate_v4(),
        "name"        VARCHAR(80)   NOT NULL,
        "description" VARCHAR(255)  NULL,
        "is_system"   BOOLEAN       NOT NULL DEFAULT false,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMPTZ   NULL,
        CONSTRAINT "PK_roles_id"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(
      `COMMENT ON TABLE "roles" IS
       'Roles del sistema. is_system=true indica roles de seed no editables vía API.'`,
    );

    // Tabla pivote role_permissions
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id"       UUID NOT NULL,
        "permission_id" UUID NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role"
          FOREIGN KEY ("role_id")
          REFERENCES "roles" ("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission"
          FOREIGN KEY ("permission_id")
          REFERENCES "permissions" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_role_permissions_role_id"
        ON "role_permissions" ("role_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_role_permissions_permission_id"
        ON "role_permissions" ("permission_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_role_permissions_permission_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_role_permissions_role_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
  }
}