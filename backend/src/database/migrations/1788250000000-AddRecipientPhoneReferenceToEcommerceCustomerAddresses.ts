import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecipientPhoneReferenceToEcommerceCustomerAddresses1788250000000
  implements MigrationInterface
{
  name = 'AddRecipientPhoneReferenceToEcommerceCustomerAddresses1788250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ecommerce_customer_addresses"
      ADD COLUMN IF NOT EXISTS "recipient_name" character varying(150),
      ADD COLUMN IF NOT EXISTS "phone" character varying(20),
      ADD COLUMN IF NOT EXISTS "reference" text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ecommerce_customer_addresses"
      DROP COLUMN IF EXISTS "reference",
      DROP COLUMN IF EXISTS "phone",
      DROP COLUMN IF EXISTS "recipient_name";
    `);
  }
}
