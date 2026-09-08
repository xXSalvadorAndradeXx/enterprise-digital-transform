import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerFavoritesTable1788000000000 implements MigrationInterface {
  name = 'CreateCustomerFavoritesTable1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_favorites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_favorites_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_customer_favorite_customer_product" UNIQUE ("customer_id", "product_id"),
        CONSTRAINT "FK_customer_favorites_customer" 
          FOREIGN KEY ("customer_id") REFERENCES "customers"("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_customer_favorites_product" 
          FOREIGN KEY ("product_id") REFERENCES "products"("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_favorite_customer_id" 
      ON "customer_favorites" ("customer_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_customer_favorite_product_id" 
      ON "customer_favorites" ("product_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_customer_favorite_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_customer_favorite_customer_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_favorites"`);
  }
}
