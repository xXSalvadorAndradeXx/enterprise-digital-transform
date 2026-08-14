import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1786100000000 implements MigrationInterface {
  name = 'CreateProductsTable1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Habilitar extensión UUID
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 2. Crear tabla products
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "inventory_id" uuid UNIQUE,
        "commercial_name" character varying(200) NOT NULL,
        "description" text,
        "sale_price" numeric(10,2) NOT NULL,
        "discount" numeric(5,2) DEFAULT 0,
        "discount_ends_at" TIMESTAMP WITH TIME ZONE,
        "status" character varying(50) NOT NULL DEFAULT 'DRAFT',
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_products_sale_price_non_negative" CHECK (sale_price >= 0),
        CONSTRAINT "CHK_products_discount_range" CHECK (discount >= 0 AND discount <= 100),
        CONSTRAINT "CHK_products_status_values" CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'DISCONTINUED'))
      )
    `);

    // 3. Claves Foráneas
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD CONSTRAINT "FK_products_inventory" 
      FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD CONSTRAINT "FK_products_created_by" 
      FOREIGN KEY ("created_by") REFERENCES "users"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD CONSTRAINT "FK_products_updated_by" 
      FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // 4. Índices
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_status" ON "products" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_sale_price" ON "products" ("sale_price")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_created_at_desc" ON "products" ("created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_discount_ends_at" ON "products" ("discount_ends_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_discount_ends_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_created_at_desc"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_sale_price"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_status"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_updated_by"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_created_by"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_inventory"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
  }
}
