import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductVariantConfigTable1786100000003 implements MigrationInterface {
  name = 'CreateProductVariantConfigTable1786100000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_variant_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "inventory_detail_id" uuid NOT NULL,
        "min_stock" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_variant_configs_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_product_variant_configs_min_stock" CHECK (min_stock >= 0),
        CONSTRAINT "UQ_product_variant_configs_product_inventory_detail" UNIQUE ("product_id", "inventory_detail_id"),
        CONSTRAINT "FK_product_variant_configs_product" 
          FOREIGN KEY ("product_id") REFERENCES "products"("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_product_variant_configs_inventory_detail" 
          FOREIGN KEY ("inventory_detail_id") REFERENCES "inventory_details"("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variant_configs"`);
  }
}
