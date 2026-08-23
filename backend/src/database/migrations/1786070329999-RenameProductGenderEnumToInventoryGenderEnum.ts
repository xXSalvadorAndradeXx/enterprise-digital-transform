import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameProductGenderEnumToInventoryGenderEnum1786070329999
  implements MigrationInterface
{
  name = 'RenameProductGenderEnumToInventoryGenderEnum1786070329999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear el nuevo tipo
    await queryRunner.query(`
      CREATE TYPE inventory_gender_enum AS ENUM ('FEMALE', 'MALE', 'UNISEX')
    `);

    // 2. Migrar la columna
    await queryRunner.query(`
      ALTER TABLE inventories
        ALTER COLUMN gender TYPE inventory_gender_enum
        USING gender::text::inventory_gender_enum
    `);

    // 3. Eliminar el tipo viejo
    await queryRunner.query(`
      DROP TYPE IF EXISTS product_gender_enum CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE product_gender_enum AS ENUM ('FEMALE', 'MALE', 'UNISEX')
    `);
    await queryRunner.query(`
      ALTER TABLE inventories
        ALTER COLUMN gender TYPE product_gender_enum
        USING gender::text::product_gender_enum
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS inventory_gender_enum CASCADE
    `);
  }
}
