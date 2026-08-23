// src/database/migrations/1660000000000-CreateDepartmentsAndDistricts.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreateDepartmentsAndDistricts1660000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create departments table
    await queryRunner.createTable(
      new Table({
        name: 'departments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '20',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create districts table
    await queryRunner.createTable(
      new Table({
        name: 'districts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '20',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'department_id',
            type: 'uuid',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Index on department_id for performance
    await queryRunner.createIndex(
      'districts',
      new TableIndex({
        name: 'IDX_DISTRICTS_DEPARTMENT_ID',
        columnNames: ['department_id'],
      }),
    );

    // Composite unique constraint (department_id, name)
    await queryRunner.createUniqueConstraint(
      'districts',
      new TableUnique({
        name: 'UQ_DISTRICTS_DEPT_ID_NAME',
        columnNames: ['department_id', 'name'],
      }),
    );

    // Foreign key from districts to departments
    await queryRunner.createForeignKey(
      'districts',
      new TableForeignKey({
        columnNames: ['department_id'],
        referencedTableName: 'departments',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
        name: 'FK_DISTRICTS_DEPARTMENT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key, unique, index, then districts table
    const table = await queryRunner.getTable('districts');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) => fk.name === 'FK_DISTRICTS_DEPARTMENT');
      if (foreignKey) await queryRunner.dropForeignKey('districts', foreignKey);

      const unique = table.uniques.find((uq) => uq.name === 'UQ_DISTRICTS_DEPT_ID_NAME');
      if (unique) await queryRunner.dropUniqueConstraint('districts', unique);

      const index = table.indices.find((idx) => idx.name === 'IDX_DISTRICTS_DEPARTMENT_ID');
      if (index) await queryRunner.dropIndex('districts', index);
    }
    await queryRunner.dropTable('districts');

    // Drop departments table
    await queryRunner.dropTable('departments');
  }
}
