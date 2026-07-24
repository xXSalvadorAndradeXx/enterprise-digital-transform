import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionsTable1737300001000 implements MigrationInterface {
  name = 'CreatePermissionsTable1737300001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id"          UUID          NOT NULL DEFAULT uuid_generate_v4(),
        "code"        VARCHAR(100)  NOT NULL,
        "description" VARCHAR(255)  NULL,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions_id"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_permissions_code"
        ON "permissions" ("code")
    `);

    await queryRunner.query(
      `COMMENT ON TABLE "permissions" IS
       'Unidades atómicas de autorización. Convención: recurso:accion. Solo lectura via API; se siembran con el seed inicial.'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_code"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
  }
}