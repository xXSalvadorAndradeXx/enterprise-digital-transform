import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductDiscountStartsAt1786200000001
  implements MigrationInterface
{
  name = 'AddProductDiscountStartsAt1786200000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "discount_starts_at" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_discount_starts_at"
      ON "products" ("discount_starts_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_products_discount_starts_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "discount_starts_at"`,
    );
  }
}
