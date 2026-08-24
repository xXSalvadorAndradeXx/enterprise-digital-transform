import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsTable1787531417899 implements MigrationInterface {
  name = 'CreatePaymentsTable1787531417899';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enums
    await queryRunner.query(
      `CREATE TYPE "public"."payments_payment_method_enum" AS ENUM('CARD', 'PAY_AT_STORE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'APPROVED', 'FAILED', 'CANCELLED', 'REFUNDED')`,
    );

    // Crear tabla payments
    await queryRunner.query(
      `CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "payment_method" "public"."payments_payment_method_enum" NOT NULL,
        "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING',
        "amount" numeric(12,2) NOT NULL,
        "currency" character varying(10) NOT NULL DEFAULT 'USD',
        "external_reference" character varying(255),
        "transaction_id" character varying(255),
        "card_last_four" character varying(4),
        "card_brand" character varying(50),
        "response_code" character varying(50),
        "approved_at" TIMESTAMP WITH TIME ZONE,
        "failed_at" TIMESTAMP WITH TIME ZONE,
        "refunded_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "payments_amount_non_negative" CHECK (amount >= 0),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payments_order_id" UNIQUE ("order_id")
      )`,
    );

    // Crear índice para order_id
    await queryRunner.query(`CREATE INDEX "IDX_payments_order_id" ON "payments" ("order_id")`);

    // Crear relación foránea hacia orders con onDelete RESTRICT
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_orders" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar relación foránea
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_orders"`);

    // Eliminar índice
    await queryRunner.query(`DROP INDEX "IDX_payments_order_id"`);

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "payments"`);

    // Eliminar enums
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_payment_method_enum"`);
  }
}
