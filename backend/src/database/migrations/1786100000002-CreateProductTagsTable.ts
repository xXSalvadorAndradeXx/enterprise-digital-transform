import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductTagsTable1786100000002 implements MigrationInterface {
  name = 'CreateProductTagsTable1786100000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_tags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "tag" character varying(50) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_tags_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_tags_product_id_tag" UNIQUE ("product_id", "tag"),
        CONSTRAINT "FK_product_tags_product" 
          FOREIGN KEY ("product_id") REFERENCES "products"("id") 
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_tags"`);
  }
}
