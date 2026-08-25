import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateBranchesAndTerritoriesTables1786400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla departments
    const hasDepartments = await queryRunner.hasTable('departments');
    if (!hasDepartments) {
      await queryRunner.createTable(
        new Table({
          name: 'departments',
          columns: [
            {
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
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
              length: '10',
              isNullable: false,
              isUnique: true,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
              isNullable: false,
            },
          ],
        }),
        true,
      );
    }

    // 2. Crear tabla districts
    const hasDistricts = await queryRunner.hasTable('districts');
    if (!hasDistricts) {
      await queryRunner.createTable(
        new Table({
          name: 'districts',
          columns: [
            {
              name: 'id',
              type: 'integer',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
              isNullable: false,
            },
            {
              name: 'department_id',
              type: 'integer',
              isNullable: false,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
              isNullable: false,
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'districts',
        new TableForeignKey({
          name: 'FK_districts_department',
          columnNames: ['department_id'],
          referencedTableName: 'departments',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
    }

    // 3. Crear o ajustar tabla branches
    const hasBranches = await queryRunner.hasTable('branches');
    if (!hasBranches) {
      await queryRunner.createTable(
        new Table({
          name: 'branches',
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
              name: 'code',
              type: 'varchar',
              length: '50',
              isNullable: false,
              isUnique: true,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '150',
              isNullable: false,
            },
            {
              name: 'address',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'phone',
              type: 'varchar',
              length: '30',
              isNullable: true,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
              isNullable: false,
            },
            {
              name: 'allows_pickup',
              type: 'boolean',
              default: false,
              isNullable: false,
            },
            {
              name: 'department_id',
              type: 'integer',
              isNullable: true,
            },
            {
              name: 'district_id',
              type: 'integer',
              isNullable: true,
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
              name: 'deleted_at',
              type: 'timestamptz',
              isNullable: true,
            },
          ],
        }),
        true,
      );
    } else {
      const branchesTable = await queryRunner.getTable('branches');
      if (branchesTable) {
        if (!branchesTable.findColumnByName('code')) {
          await queryRunner.query(
            `ALTER TABLE "branches" ADD "code" varchar(50) NOT NULL DEFAULT 'SUC-DEFAULT'`,
          );
          await queryRunner.query(
            `ALTER TABLE "branches" ADD CONSTRAINT "UQ_branches_code" UNIQUE ("code")`,
          );
        }
        if (!branchesTable.findColumnByName('phone')) {
          await queryRunner.query(
            `ALTER TABLE "branches" ADD "phone" varchar(30) NULL`,
          );
        }
        if (!branchesTable.findColumnByName('allows_pickup')) {
          await queryRunner.query(
            `ALTER TABLE "branches" ADD "allows_pickup" boolean NOT NULL DEFAULT false`,
          );
        }
        if (!branchesTable.findColumnByName('department_id')) {
          await queryRunner.query(
            `ALTER TABLE "branches" ADD "department_id" integer NULL`,
          );
        }
        if (!branchesTable.findColumnByName('district_id')) {
          await queryRunner.query(
            `ALTER TABLE "branches" ADD "district_id" integer NULL`,
          );
        }
        if (!branchesTable.findColumnByName('deleted_at')) {
          await queryRunner.query(
            `ALTER TABLE "branches" ADD "deleted_at" timestamptz NULL`,
          );
        }
      }
    }

    // Claves foráneas hacia departments y districts
    await queryRunner.createForeignKey(
      'branches',
      new TableForeignKey({
        name: 'FK_branches_department',
        columnNames: ['department_id'],
        referencedTableName: 'departments',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'branches',
      new TableForeignKey({
        name: 'FK_branches_district',
        columnNames: ['district_id'],
        referencedTableName: 'districts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Índices
    await queryRunner.createIndex(
      'branches',
      new TableIndex({
        name: 'IDX_branches_department_id',
        columnNames: ['department_id'],
      }),
    );

    await queryRunner.createIndex(
      'branches',
      new TableIndex({
        name: 'IDX_branches_district_id',
        columnNames: ['district_id'],
      }),
    );

    await queryRunner.createIndex(
      'branches',
      new TableIndex({
        name: 'IDX_branches_is_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'branches',
      new TableIndex({
        name: 'IDX_branches_allows_pickup',
        columnNames: ['allows_pickup'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const branchesTable = await queryRunner.getTable('branches');
    if (branchesTable) {
      await queryRunner.dropIndex('branches', 'IDX_branches_allows_pickup');
      await queryRunner.dropIndex('branches', 'IDX_branches_is_active');
      await queryRunner.dropIndex('branches', 'IDX_branches_district_id');
      await queryRunner.dropIndex('branches', 'IDX_branches_department_id');
      await queryRunner.dropForeignKey('branches', 'FK_branches_district');
      await queryRunner.dropForeignKey('branches', 'FK_branches_department');
    }
    await queryRunner.dropTable('branches', true);
    await queryRunner.dropTable('districts', true);
    await queryRunner.dropTable('departments', true);
  }
}
