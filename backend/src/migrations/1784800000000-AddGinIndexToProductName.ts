import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGinIndexToProductName1784800000000 implements MigrationInterface {
  name = 'AddGinIndexToProductName1784800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "idx_inventories_product_name_gin" ON "inventories" USING gin(to_tsvector('spanish', "product_name"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "idx_inventories_product_name_gin"`,
    );
  }
}
