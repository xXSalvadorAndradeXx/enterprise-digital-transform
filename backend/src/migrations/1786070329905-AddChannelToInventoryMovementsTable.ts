import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChannelToInventoryMovementsTable1786070329905
  implements MigrationInterface
{
  name = 'AddChannelToInventoryMovementsTable1786070329905';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear el tipo ENUM para el canal del movimiento
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."inventory_movement_channel_enum" AS ENUM('TIENDA_FISICA', 'ECOMMERCE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    );

    // 2. Crear la tabla inventory_movements si no existe
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."inventory_movements_type_enum" AS ENUM('Entrada', 'Salida');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."inventory_movements_type_enum" NOT NULL,
        "quantity" numeric(12,4) NOT NULL,
        "stock_before" numeric(12,4) NOT NULL,
        "stock_after" numeric(12,4) NOT NULL,
        "notes" character varying(255),
        "reference_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "product_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        CONSTRAINT "PK_inventory_movements_id" PRIMARY KEY ("id")
      );
    `);

    // 3. Agregar la columna channel NOT NULL con valor por defecto
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD COLUMN IF NOT EXISTS "channel" "public"."inventory_movement_channel_enum" NOT NULL DEFAULT 'TIENDA_FISICA'`,
    );

    // 4. Crear índice sobre la columna channel para optimizar filtros
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_channel" ON "inventory_movements" ("channel")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar índice
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_inventory_movements_channel"`,
    );

    // 2. Eliminar columna channel
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP COLUMN IF EXISTS "channel"`,
    );

    // 3. Eliminar tipo ENUM
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."inventory_movement_channel_enum"`,
    );
  }
}
