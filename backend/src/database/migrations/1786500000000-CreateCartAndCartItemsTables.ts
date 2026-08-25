import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableCheck,
  TableUnique,
} from 'typeorm';

export class CreateCartAndCartItemsTables1786500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar las tablas previas si existían con esquema entero
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "carts" CASCADE`);

    // Crear ENUM tipo cart_status_enum si no existe
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "cart_status_enum" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
    );

    // 2. Crear tabla carts con identificador UUID y CHECK XOR
    await queryRunner.createTable(
      new Table({
        name: 'carts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'guest_token_hash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: 'cart_status_enum',
            default: `'ACTIVE'`,
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Restricción CHECK XOR para propietario del carrito
    await queryRunner.createCheckConstraint(
      'carts',
      new TableCheck({
        name: 'CHK_cart_owner_xor',
        expression:
          '(customer_id IS NOT NULL AND guest_token_hash IS NULL) OR (customer_id IS NULL AND guest_token_hash IS NOT NULL)',
      }),
    );

    // Clave foránea customer_id hacia users(id)
    await queryRunner.createForeignKey(
      'carts',
      new TableForeignKey({
        name: 'FK_carts_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Índices de carts
    await queryRunner.createIndex(
      'carts',
      new TableIndex({
        name: 'IDX_carts_customer_id',
        columnNames: ['customer_id'],
      }),
    );
    await queryRunner.createIndex(
      'carts',
      new TableIndex({
        name: 'IDX_carts_guest_token_hash',
        columnNames: ['guest_token_hash'],
      }),
    );
    await queryRunner.createIndex(
      'carts',
      new TableIndex({
        name: 'IDX_carts_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'carts',
      new TableIndex({
        name: 'IDX_carts_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    // 3. Crear tabla cart_items con UUIDs, CHECK quantity > 0 y UNIQUE(cart_id, variant_id)
    await queryRunner.createTable(
      new Table({
        name: 'cart_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cart_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'variant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Restricción CHECK quantity > 0
    await queryRunner.createCheckConstraint(
      'cart_items',
      new TableCheck({
        name: 'CHK_cart_item_quantity_positive',
        expression: 'quantity > 0',
      }),
    );

    // Restricción UNIQUE (cart_id, variant_id)
    await queryRunner.createUniqueConstraint(
      'cart_items',
      new TableUnique({
        name: 'UQ_cart_item_cart_variant',
        columnNames: ['cart_id', 'variant_id'],
      }),
    );

    // Claves foráneas de cart_items
    await queryRunner.createForeignKey(
      'cart_items',
      new TableForeignKey({
        name: 'FK_cart_items_cart',
        columnNames: ['cart_id'],
        referencedTableName: 'carts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'cart_items',
      new TableForeignKey({
        name: 'FK_cart_items_product',
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'cart_items',
      new TableForeignKey({
        name: 'FK_cart_items_variant',
        columnNames: ['variant_id'],
        referencedTableName: 'product_variant_configs',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Índices de cart_items
    await queryRunner.createIndex(
      'cart_items',
      new TableIndex({
        name: 'IDX_cart_items_cart_id',
        columnNames: ['cart_id'],
      }),
    );
    await queryRunner.createIndex(
      'cart_items',
      new TableIndex({
        name: 'IDX_cart_items_variant_id',
        columnNames: ['variant_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cart_items', true);
    await queryRunner.dropTable('carts', true);
    await queryRunner.query(`DROP TYPE IF EXISTS "cart_status_enum"`);
  }
}
