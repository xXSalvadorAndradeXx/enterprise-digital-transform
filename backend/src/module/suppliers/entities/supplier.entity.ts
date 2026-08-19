import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { SupplierPurchase } from './supplier-purchase.entity';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  name!: string;

  @Column({ name: 'contact_name', type: 'varchar', length: 150, nullable: true })
  contactName?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;

  @OneToMany(() => SupplierPurchase, (purchase) => purchase.supplier)
  supplierPurchases!: SupplierPurchase[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizePhone(): void {
    if (!this.phone) {
      return;
    }
    let cleaned = this.phone.replace(/[^\d+]/g, '');
    if (/^\d{8}$/.test(cleaned)) {
      cleaned = `+503${cleaned}`;
    }
    this.phone = cleaned;
  }
}
