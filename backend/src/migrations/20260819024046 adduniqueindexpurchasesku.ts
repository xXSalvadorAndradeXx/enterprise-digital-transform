import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueIndexPurchaseSku20260819024046 implements MigrationInterface {
  name = 'AddUniqueIndexPurchaseSku20260819024046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar constraint de unicidad global si aún existe
    await queryRunner.query(`
      ALTER TABLE "supplier_purchase_items"
      DROP CONSTRAINT IF EXISTS "UQ_7591dc2d8ae53e9165543239c05"
    `);

    // 2. Crear índice único compuesto (purchase_id, sku)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_supplier_purchase_items_purchase_sku"
      ON "supplier_purchase_items" ("purchase_id", "sku")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice compuesto
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_supplier_purchase_items_purchase_sku"
    `);

    // NOTA: No se restaura la unicidad global (UQ sobre sku solo)
    // porque pueden existir registros con el mismo SKU en distintas compras.
  }
}