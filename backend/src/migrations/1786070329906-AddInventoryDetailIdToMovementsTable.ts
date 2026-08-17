import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryDetailIdToMovementsTable1786070329906
  implements MigrationInterface
{
  name = 'AddInventoryDetailIdToMovementsTable1786070329906';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columna inventory_detail_id
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD COLUMN IF NOT EXISTS "inventory_detail_id" uuid`,
    );

    // 2. Agregar clave foránea hacia inventory_details
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "inventory_movements"
        ADD CONSTRAINT "FK_inventory_movements_detail"
        FOREIGN KEY ("inventory_detail_id")
        REFERENCES "inventory_details"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Crear índice para optimizar consultas y trazabilidad por variante
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_detail_id" ON "inventory_movements" ("inventory_detail_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar clave foránea
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT IF EXISTS "FK_inventory_movements_detail"`,
    );

    // 2. Eliminar índice
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_inventory_movements_detail_id"`,
    );

    // 3. Eliminar columna inventory_detail_id
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP COLUMN IF EXISTS "inventory_detail_id"`,
    );
  }
}
