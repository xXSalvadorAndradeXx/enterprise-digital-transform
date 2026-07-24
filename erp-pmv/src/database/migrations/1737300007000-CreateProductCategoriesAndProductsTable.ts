// src/database/migrations/1737300007000-CreateProductCategoriesAndProductsTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductCategoriesAndProductsTable1737300007000
  implements MigrationInterface
{
  name = 'CreateProductCategoriesAndProductsTable1737300007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla product_categories
    await queryRunner.query(`
      CREATE TABLE "product_categories" (
        "id"          UUID          NOT NULL DEFAULT uuid_generate_v4(),
        "name"        VARCHAR(100)  NOT NULL,
        "description" VARCHAR(255)  NULL,
        "is_active"   BOOLEAN       NOT NULL DEFAULT true,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMPTZ   NULL,
        CONSTRAINT "PK_product_categories_id"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_categories_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "product_categories" IS
      'Categorías del catálogo de productos.'
    `);

    // Tabla products
    await queryRunner.query(`
      CREATE TYPE "product_unit" AS ENUM (
        'UNIT',
        'KG',
        'LB',
        'LITER',
        'BOX',
        'PACK'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"          UUID            NOT NULL DEFAULT uuid_generate_v4(),
        "sku"         VARCHAR(60)     NOT NULL,
        "name"        VARCHAR(150)    NOT NULL,
        "description" TEXT            NULL,
        "unit"        "product_unit"  NOT NULL DEFAULT 'UNIT',
        "cost"        NUMERIC(12,2)   NOT NULL DEFAULT 0,
        "price"       NUMERIC(12,2)   NOT NULL DEFAULT 0,
        "min_stock"   NUMERIC(12,4)   NOT NULL DEFAULT 0,
        "is_active"   BOOLEAN         NOT NULL DEFAULT true,
        "created_at"  TIMESTAMPTZ     NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ     NOT NULL DEFAULT now(),
        "deleted_at"  TIMESTAMPTZ     NULL,
        "category_id" UUID            NULL,
        CONSTRAINT "PK_products_id"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_sku"  UNIQUE ("sku"),
        CONSTRAINT "FK_products_category"
          FOREIGN KEY ("category_id")
          REFERENCES "product_categories" ("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_sku"
        ON "products" ("sku")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_category_id"
        ON "products" ("category_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_name"
        ON "products" (LOWER("name"))
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "products" IS
      'Catálogo de productos del ERP.'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_category_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_sku"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "product_unit"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_categories"`);
  }
}