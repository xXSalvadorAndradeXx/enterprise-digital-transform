import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventoryDetailsTable1786070329904 implements MigrationInterface {
    name = 'CreateInventoryDetailsTable1786070329904'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "supplier_purchase_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "purchase_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "quantity" numeric(10,2) NOT NULL,
                "unit_cost" numeric(10,2) NOT NULL,
                "subtotal" numeric(12,2) NOT NULL,
                CONSTRAINT "PK_supplier_purchase_items_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_supplier_purchase_items_purchase" FOREIGN KEY ("purchase_id") REFERENCES "supplier_purchases"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "purchase_status_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "purchase_id" uuid NOT NULL,
                "from_status" character varying(20),
                "to_status" character varying(20) NOT NULL,
                "changed_by" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_purchase_status_history_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_purchase_status_history_purchase" FOREIGN KEY ("purchase_id") REFERENCES "supplier_purchases"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);

        await queryRunner.query(
            `CREATE TABLE "inventory_details" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "sku" character varying(100) NOT NULL, 
                "size" character varying(50) NOT NULL, 
                "color" character varying(7) NOT NULL, 
                "stock" integer NOT NULL DEFAULT '0', 
                "unit_cost" numeric(10,2) NOT NULL DEFAULT '0', 
                "min_stock" integer NOT NULL DEFAULT '0', 
                "inventory_id" uuid NOT NULL, 
                "purchase_item_id" uuid, 
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), 
                CONSTRAINT "UQ_bbe72ff23c8d75eb4bb6c4d191f" UNIQUE ("sku"), 
                CONSTRAINT "REL_f11f9f675827128cf1d7418bc5" UNIQUE ("purchase_item_id"), 
                CONSTRAINT "color_hex_format" CHECK (color ~ '^#[0-9a-fA-F]{6}$'), 
                CONSTRAINT "min_stock_non_negative" CHECK (min_stock >= 0), 
                CONSTRAINT "unit_cost_non_negative" CHECK (unit_cost >= 0), 
                CONSTRAINT "stock_non_negative" CHECK (stock >= 0), 
                CONSTRAINT "PK_683768d20320aec50b45e7b0e7f" PRIMARY KEY ("id")
            )`
        );
        await queryRunner.query(`CREATE INDEX "IDX_634d300a22785103ea37759377" ON "inventory_details" ("inventory_id", "size", "color")`);
        await queryRunner.query(`ALTER TABLE "inventory_details" ADD CONSTRAINT "FK_b6dfdb4875a0860ba9f89bb2e93" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_details" ADD CONSTRAINT "FK_f11f9f675827128cf1d7418bc53" FOREIGN KEY ("purchase_item_id") REFERENCES "supplier_purchase_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_details" DROP CONSTRAINT IF EXISTS "FK_f11f9f675827128cf1d7418bc53"`);
        await queryRunner.query(`ALTER TABLE "inventory_details" DROP CONSTRAINT IF EXISTS "FK_b6dfdb4875a0860ba9f89bb2e93"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_634d300a22785103ea37759377"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "inventory_details" CASCADE`);
    }
}
