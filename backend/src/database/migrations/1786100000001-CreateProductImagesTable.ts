import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductImagesTable1786100000001 implements MigrationInterface {
  name = 'CreateProductImagesTable1786100000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Documentación: El límite máximo de 10 imágenes por producto se valida en ProductService (capa de aplicación).
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_images" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "image_url" character varying(500) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_images_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_images_product" 
          FOREIGN KEY ("product_id") REFERENCES "products"("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_images"`);
  }
}
