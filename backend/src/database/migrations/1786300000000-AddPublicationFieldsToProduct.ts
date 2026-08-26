import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddPublicationFieldsToProduct1786300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('products');
    if (table) {
      if (!table.findColumnByName('is_published')) {
        await queryRunner.addColumn(
          'products',
          new TableColumn({
            name: 'is_published',
            type: 'boolean',
            default: false,
            isNullable: false,
          }),
        );
      }

      if (!table.findColumnByName('published_at')) {
        await queryRunner.addColumn(
          'products',
          new TableColumn({
            name: 'published_at',
            type: 'timestamptz',
            isNullable: true,
          }),
        );
      }

      const hasIndex = table.indices.some((idx) => idx.columnNames.includes('is_published'));
      if (!hasIndex) {
        await queryRunner.createIndex(
          'products',
          new TableIndex({
            name: 'IDX_products_is_published',
            columnNames: ['is_published'],
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('products');
    if (table) {
      if (table.findColumnByName('is_published')) {
        await queryRunner.dropIndex('products', 'IDX_products_is_published');
        await queryRunner.dropColumn('products', 'is_published');
      }

      if (table.findColumnByName('published_at')) {
        await queryRunner.dropColumn('products', 'published_at');
      }
    }
  }
}
