import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrdersPaymentsAndReservations1787600000000 implements MigrationInterface {
  name = 'AddOrdersPaymentsAndReservations1787600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "orders_status_enum" AS ENUM('NEW', 'PENDING', 'ON_ROUTE', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "orders_delivery_method_enum" AS ENUM('HOME_DELIVERY', 'PICKUP');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payments_payment_method_enum" AS ENUM('CARD', 'PAY_AT_STORE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payments_status_enum" AS ENUM('PENDING', 'APPROVED', 'FAILED', 'CANCELLED', 'REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "inventory_reservations_status_enum" AS ENUM('PENDING', 'COMMITTED', 'RELEASED', 'EXPIRED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "checkout_idempotency_status_enum" AS ENUM('PROCESSING', 'COMPLETED', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. User Columns
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "total_orders" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "total_spent" numeric(12,2) NOT NULL DEFAULT '0.00',
      ADD COLUMN IF NOT EXISTS "last_order_at" TIMESTAMP WITH TIME ZONE;
    `);

    // 3. customer_addresses
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customer_addresses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "label" character varying(100),
        "department" character varying(100) NOT NULL,
        "district" character varying(100) NOT NULL,
        "city" character varying(100),
        "address_line" character varying(255) NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_customer_addresses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_customer_addresses_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // 4. guest_customers
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "guest_customers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "name" character varying,
        "phone" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_guest_customers" PRIMARY KEY ("id")
      );
    `);

    // 5. order_deliveries
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_deliveries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "trackingNumber" character varying,
        "estimatedDeliveryDate" date,
        "department" character varying(100),
        "district" character varying(100),
        "city" character varying(100),
        "address_line" character varying(255),
        "branch_id" uuid,
        "branch_name" character varying(100),
        "branch_address" character varying(255),
        "branch_phone" character varying(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_deliveries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_deliveries_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL
      );
    `);

    // 6. orders
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderNumber" character varying(8) NOT NULL,
        "subtotal" numeric(12,2) NOT NULL DEFAULT '0.00',
        "discount_total" numeric(12,2) NOT NULL DEFAULT '0.00',
        "delivery_cost" numeric(12,2) NOT NULL DEFAULT '0.00',
        "total_amount" numeric(12,2) NOT NULL DEFAULT '0.00',
        "status" "orders_status_enum" NOT NULL DEFAULT 'NEW',
        "delivery_method" "orders_delivery_method_enum" NOT NULL DEFAULT 'HOME_DELIVERY',
        "customer_id" uuid,
        "guest_customer_id" uuid,
        "customer_email" character varying(150),
        "customer_name" character varying(150),
        "customer_phone" character varying(50),
        "deliveryId" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_orders_orderNumber" UNIQUE ("orderNumber"),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_orders_guest_customer" FOREIGN KEY ("guest_customer_id") REFERENCES "guest_customers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_orders_delivery" FOREIGN KEY ("deliveryId") REFERENCES "order_deliveries"("id") ON DELETE SET NULL
      );
    `);

    // 7. order_items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quantity" integer NOT NULL,
        "unitPrice" numeric(12,2) NOT NULL,
        "sale_price_snapshot" numeric(10,2) NOT NULL DEFAULT '0',
        "discount_snapshot" numeric(5,2) DEFAULT '0',
        "subtotal" numeric(12,2) NOT NULL DEFAULT '0',
        "size" character varying(50),
        "color" character varying(50),
        "sku" character varying(100),
        "orderId" uuid,
        "productId" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL
      );
    `);

    // 8. order_status_history
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status_before" "orders_status_enum",
        "status_after" "orders_status_enum" NOT NULL,
        "changed_by_id" uuid,
        "notes" text,
        "changed_at" TIMESTAMP NOT NULL DEFAULT now(),
        "order_id" uuid,
        CONSTRAINT "PK_order_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_status_history_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_status_history_changed_by" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    // 9. checkout_idempotencies
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "checkout_idempotencies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying(255) NOT NULL,
        "request_hash" character varying(64) NOT NULL,
        "source" character varying(50) NOT NULL,
        "cart_id" character varying(255),
        "customer_id" uuid,
        "status" "checkout_idempotency_status_enum" NOT NULL DEFAULT 'PROCESSING',
        "response_code" integer,
        "response_body" jsonb,
        "order_id" uuid,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_checkout_idempotencies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_checkout_idempotencies_key" UNIQUE ("key")
      );
    `);

    // 10. inventory_reservations
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_reservations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "inventory_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "status" "inventory_reservations_status_enum" NOT NULL DEFAULT 'PENDING',
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_reservations" PRIMARY KEY ("id")
      );
    `);

    // 11. payments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "payment_method" "payments_payment_method_enum" NOT NULL,
        "status" "payments_status_enum" NOT NULL DEFAULT 'PENDING',
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
        CONSTRAINT "UQ_payments_order_id" UNIQUE ("order_id"),
        CONSTRAINT "FK_payments_orders" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_reservations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checkout_idempotencies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_status_history" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_deliveries" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "guest_customers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customer_addresses" CASCADE`);
  }
}
