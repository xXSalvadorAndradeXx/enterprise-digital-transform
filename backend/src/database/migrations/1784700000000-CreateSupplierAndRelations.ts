import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupplierAndRelations1784700000000 implements MigrationInterface {
  name = 'CreateSupplierAndRelations1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear extensión uuid-ossp si no existe
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // 2. Crear tabla suppliers si no existe
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(150) NOT NULL,
        "contact_name" character varying(150),
        "phone" character varying(30),
        "email" character varying(150),
        "address" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_suppliers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_suppliers_name" UNIQUE ("name")
      )
    `);

    // 3. Crear índice único case-insensitive sobre LOWER(name)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_suppliers_name_lower" 
      ON "suppliers" (LOWER("name")) 
      WHERE "deleted_at" IS NULL
    `);

    // 4. Agregar columna supplierId / FK a products
    const hasSupplierId = await queryRunner.hasColumn("products", "supplierId");
    if (!hasSupplierId) {
      await queryRunner.query(`
        ALTER TABLE "products" 
        ADD COLUMN "supplierId" uuid
      `);
    }

    // Verificar FK
    const table = await queryRunner.getTable("products");
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("supplierId") !== -1);
    if (!foreignKey) {
      await queryRunner.query(`
        ALTER TABLE "products" 
        ADD CONSTRAINT "FK_products_supplier" 
        FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") 
        ON DELETE SET NULL ON UPDATE NO ACTION
      `);
    }

    // 5. Crear enum de género si no existe
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE product_gender_enum AS ENUM ('FEMALE', 'MALE', 'UNISEX');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 6. Crear tabla supplier_purchases si no existe
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "supplier_purchases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "supplier_id" uuid NOT NULL,
        "gender" product_gender_enum,
        "status" character varying(50) NOT NULL DEFAULT 'PENDIENTE',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_supplier_purchases_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_supplier_purchases_supplier" 
          FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") 
          ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar tabla supplier_purchases
    await queryRunner.query(`DROP TABLE IF EXISTS "supplier_purchases"`);
    
    // Eliminar enum de género
    await queryRunner.query(`DROP TYPE IF EXISTS product_gender_enum CASCADE`);

    // 2. Eliminar FK y columna supplierId de products si existen
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_supplier"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "supplierId"`);

    // 3. Eliminar índice case-insensitive
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_suppliers_name_lower"`);

    // 4. Eliminar tabla suppliers
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);
  }
}
