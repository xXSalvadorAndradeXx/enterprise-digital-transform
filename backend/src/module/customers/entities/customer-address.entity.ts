// src/module/customers/entities/customer-address.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Department } from '../../branches/entities/department.entity';
import { District } from '../../branches/entities/district.entity';

@Entity('ecommerce_customer_addresses')
export class CustomerAddress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId!: string;

  @Column({ name: 'department_id', type: 'integer', nullable: false })
  departmentId!: number | string;

  @Column({ name: 'district_id', type: 'integer', nullable: false })
  districtId!: number | string;

  @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ name: 'address_line', type: 'text', nullable: false })
  addressLine!: string;

  @Column({ name: 'label', type: 'varchar', length: 50, nullable: false })
  label!: string;

  @Column({ name: 'is_default', type: 'boolean', default: false, nullable: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  // Relations
  @ManyToOne(() => Customer, (customer) => customer.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department!: Department;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'district_id' })
  district!: District;
}
