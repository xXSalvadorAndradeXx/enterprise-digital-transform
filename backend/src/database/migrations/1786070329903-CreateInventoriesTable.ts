import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventoriesTable1786070329903 implements MigrationInterface {
    name = 'CreateInventoriesTable1786070329903'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Asegurar la extensión para UUIDs
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        
        // Crear el tipo ENUM para el estado
        await queryRunner.query(`CREATE TYPE "public"."inventories_status_enum" AS ENUM('ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK')`);
        
        // Crear la tabla inventories
        await queryRunner.query(`CREATE TABLE "inventories" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "product_name" character varying(200) NOT NULL, 
            "brand" character varying(100) NOT NULL, 
            "gender" product_gender_enum,
            "main_image_url" character varying(500), 
            "status" "public"."inventories_status_enum" NOT NULL DEFAULT 'ACTIVE', 
            "supplier_id" uuid, 
            "category_id" integer, 
            "purchase_id" uuid, 
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
            "deleted_at" TIMESTAMP WITH TIME ZONE, 
            "stock" numeric(12,4) NOT NULL DEFAULT '0', 
            "reserved" numeric(12,4) NOT NULL DEFAULT '0', 
            "product_id" integer, 
            CONSTRAINT "REL_5f8ef4645f837ca835e90d78c5" UNIQUE ("purchase_id"), 
            CONSTRAINT "REL_92fc0c77bab4a656b9619322c6" UNIQUE ("product_id"), 
            CONSTRAINT "PK_7b1946392ffdcb50cfc6ac78c0e" PRIMARY KEY ("id")
        )`);
        
        // Restricción CHECK para status
        await queryRunner.query(`ALTER TABLE "inventories" ADD CONSTRAINT "chk_inventories_status" CHECK (status::text IN ('ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK'))`);
        
        // Índice GIN sobre product_name
        await queryRunner.query(`CREATE INDEX "idx_inventories_product_name_gin" ON "inventories" USING gin(to_tsvector('spanish', "product_name"))`);
        
        // Índices individuales requeridos
        await queryRunner.query(`CREATE INDEX "IDX_efd425ab4b2785296c01ac6780" ON "inventories" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_3bed26289926c1ad4a08d4c728" ON "inventories" ("supplier_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_85e09f62b3421df796c3eb3f68" ON "inventories" ("category_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_fec544b61606dfdf6e6a3fbac8" ON "inventories" ("created_at")`);
        
        // Llaves foráneas
        await queryRunner.query(`ALTER TABLE "inventories" ADD CONSTRAINT "FK_3bed26289926c1ad4a08d4c7285" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventories" ADD CONSTRAINT "FK_85e09f62b3421df796c3eb3f687" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventories" ADD CONSTRAINT "FK_5f8ef4645f837ca835e90d78c5c" FOREIGN KEY ("purchase_id") REFERENCES "supplier_purchases"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventories" ADD CONSTRAINT "FK_92fc0c77bab4a656b9619322c62" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar llaves foráneas de inventories
        await queryRunner.query(`ALTER TABLE "inventories" DROP CONSTRAINT IF EXISTS "FK_92fc0c77bab4a656b9619322c62"`);
        await queryRunner.query(`ALTER TABLE "inventories" DROP CONSTRAINT IF EXISTS "FK_5f8ef4645f837ca835e90d78c5c"`);
        await queryRunner.query(`ALTER TABLE "inventories" DROP CONSTRAINT IF EXISTS "FK_85e09f62b3421df796c3eb3f687"`);
        await queryRunner.query(`ALTER TABLE "inventories" DROP CONSTRAINT IF EXISTS "FK_3bed26289926c1ad4a08d4c7285"`);
        
        // Eliminar índices
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_fec544b61606dfdf6e6a3fbac8"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_85e09f62b3421df796c3eb3f68"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_3bed26289926c1ad4a08d4c728"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_efd425ab4b2785296c01ac6780"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_inventories_product_name_gin"`);
        
        // Eliminar tabla y tipo
        await queryRunner.query(`DROP TABLE IF EXISTS "inventories" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."inventories_status_enum"`);
    }
}
