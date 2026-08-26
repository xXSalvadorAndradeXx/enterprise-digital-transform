import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncVariantConfigsForHistoricProducts1787800000000
  implements MigrationInterface
{
  name = 'SyncVariantConfigsForHistoricProducts1787800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "product_variant_configs" ("id", "product_id", "inventory_detail_id", "min_stock", "created_at", "updated_at")
      SELECT 
        uuid_generate_v4() as "id",
        p."id" as "product_id",
        idt."id" as "inventory_detail_id",
        COALESCE(idt."min_stock", 0) as "min_stock",
        NOW() as "created_at",
        NOW() as "updated_at"
      FROM "products" p
      JOIN "inventory_details" idt ON idt."inventory_id" = p."inventory_id"
      LEFT JOIN "product_variant_configs" pvc ON pvc."product_id" = p."id" AND pvc."inventory_detail_id" = idt."id"
      WHERE pvc."id" IS NULL AND p."inventory_id" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // down vacío
  }
}
