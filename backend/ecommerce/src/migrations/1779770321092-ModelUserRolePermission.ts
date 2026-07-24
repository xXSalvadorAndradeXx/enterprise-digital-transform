import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";
import { PERMISSIONS_CATALOG } from "../common/constants/permissions.constant";

export class ModelUserRolePermission1779770321092 implements MigrationInterface {
    name = 'ModelUserRolePermission1779770321092'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Habilitar la extensión para UUID si no existe
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // 2. Eliminar la restricción de llave foránea existente en la tabla carts que apunta a users
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT IF EXISTS "FK_69828a178f152f157dcf2f70a89"`);

        // 3. Eliminar la tabla users actual
        await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

        // 4. Crear la tabla users con la nueva estructura (UUID, first_name, last_name, etc.)
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "first_name" character varying(100) NOT NULL,
                "last_name" character varying(100) NOT NULL,
                "email" character varying(150) NOT NULL,
                "password_hash" character varying(255) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "must_change_password" boolean NOT NULL DEFAULT true,
                "failed_login_attempts" smallint NOT NULL DEFAULT 0,
                "locked_until" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // 5. Ajustar la columna userId en carts a tipo UUID
        await queryRunner.query(`ALTER TABLE "carts" DROP COLUMN IF EXISTS "userId"`);
        await queryRunner.query(`ALTER TABLE "carts" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "REL_69828a178f152f157dcf2f70a8" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_69828a178f152f157dcf2f70a89" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // 6. Crear la tabla de roles
        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(80) NOT NULL,
                "description" character varying(255),
                "is_system" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_c24c7a10cd6c8c4df269389e7e1" UNIQUE ("name"),
                CONSTRAINT "PK_c143b1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);


        // 7. Crear la tabla de permisos
        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" character varying(100) NOT NULL,
                "description" character varying(255),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_48ce11b403d7c3b2cd1cc44a9e1" UNIQUE ("code"),
                CONSTRAINT "PK_9203b1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // 8. Crear la tabla intermedia user_roles
        await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "user_id" uuid NOT NULL,
                "role_id" uuid NOT NULL,
                CONSTRAINT "PK_4068ef066f1e29e577c3ed03f7e" PRIMARY KEY ("user_id", "role_id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_87b588db6c10976f18967bda53" ON "user_roles" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35ad1" ON "user_roles" ("role_id")`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b588db6c10976f18967bda53f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35ad17" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);

        // 9. Crear la tabla intermedia role_permissions
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "permission_id" uuid NOT NULL,
                "role_id" uuid NOT NULL,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("permission_id", "role_id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_role_permissions_permission" ON "role_permissions" ("permission_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_role_permissions_role" ON "role_permissions" ("role_id")`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);

        // 10. Sembrar catálogo de permisos (upsert por code)
        for (const perm of PERMISSIONS_CATALOG) {
            await queryRunner.query(
                `INSERT INTO "permissions" ("code", "description") VALUES ($1, $2) ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description"`,
                [perm.code, perm.description]
            );
        }

        // 11. Sembrar el rol SUPERADMIN (is_system = true)
        const superAdminRoleResult = await queryRunner.query(
            `INSERT INTO "roles" ("name", "description", "is_system")
             VALUES ('SUPERADMIN', 'Super administrador con acceso total a todos los módulos', true)
             ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description", "is_system" = EXCLUDED."is_system"
             RETURNING "id"`
        );
        const superAdminRoleId = superAdminRoleResult[0].id;

        // 12. Vincular la totalidad de permisos al rol SUPERADMIN
        const dbPermissions = await queryRunner.query(`SELECT "id" FROM "permissions"`);
        for (const perm of dbPermissions) {
            await queryRunner.query(
                `INSERT INTO "role_permissions" ("role_id", "permission_id")
                 VALUES ($1, $2)
                 ON CONFLICT ("permission_id", "role_id") DO NOTHING`,
                [superAdminRoleId, perm.id]
            );
        }

        // 13. Sembrar usuario inicial Super Admin (opcional para desarrollo)
        const defaultEmail = 'superadmin@ecommerce.local';
        const existingSuperAdmin = await queryRunner.query(
            `SELECT "id" FROM "users" WHERE "email" = $1`,
            [defaultEmail]
        );

        if (existingSuperAdmin.length === 0) {
            const passwordHash = await bcrypt.hash('superadmin123', 10);
            const userResult = await queryRunner.query(
                `INSERT INTO "users" (
                    "first_name", 
                    "last_name", 
                    "email", 
                    "password_hash", 
                    "is_active", 
                    "must_change_password", 
                    "failed_login_attempts"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING "id"`,
                ['Super', 'Admin', defaultEmail, passwordHash, true, true, 0]
            );
            const newUserId = userResult[0].id;

            // Vincular el rol SUPERADMIN al nuevo usuario
            await queryRunner.query(
                `INSERT INTO "user_roles" ("user_id", "role_id") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [newUserId, superAdminRoleId]
            );
            
            // También crear un carrito vacío asociado al nuevo usuario
            await queryRunner.query(
                `INSERT INTO "carts" ("userId") VALUES ($1) ON CONFLICT ("userId") DO NOTHING`,
                [newUserId]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Deshacer todos los cambios en orden inverso
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_role"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permission"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);

        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_role"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_user"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);

        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);

        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_69828a178f152f157dcf2f70a89"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "REL_69828a178f152f157dcf2f70a8"`);
        await queryRunner.query(`ALTER TABLE "carts" DROP COLUMN "userId"`);

        await queryRunner.query(`DROP TABLE "users"`);

        // Recrear la tabla users original (para el down de la migración)
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL, 
                "nombre" character varying NOT NULL, 
                "email" character varying NOT NULL, 
                "password" character varying NOT NULL, 
                "rol" character varying NOT NULL DEFAULT 'cliente', 
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), 
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Recrear la columna original en carts
        await queryRunner.query(`ALTER TABLE "carts" ADD "userId" integer`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "REL_69828a178f152f157dcf2f70a8" UNIQUE ("userId")`);
        await queryRunner.query(`ALTER TABLE "carts" ADD CONSTRAINT "FK_69828a178f152f157dcf2f70a89" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
