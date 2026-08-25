import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { DeliveryType } from '../enums/delivery-type.enum';

@Entity({ name: 'order_deliveries' })
export class OrderDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId!: string;

  @OneToOne(() => Order, (order) => order.delivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'enum', enum: DeliveryType, name: 'delivery_type' })
  deliveryType!: DeliveryType;

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ type: 'date', nullable: true })
  estimatedDeliveryDate?: Date;

  // Snapshot de dirección para entrega a domicilio
  @Column({ type: 'varchar', length: 50, name: 'department_id', nullable: true })
  departmentId?: string | null;

  @Column({ type: 'varchar', length: 50, name: 'district_id', nullable: true })
  districtId?: string | null;

  @Column({ type: 'varchar', length: 100, name: 'department_name', nullable: true })
  departmentName?: string | null;

  @Column({ type: 'varchar', length: 100, name: 'district_name', nullable: true })
  districtName?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'address_line' })
  addressLine?: string | null;

  // Relación con sucursal (para el método de retiro en tienda)
  @Column({ type: 'uuid', nullable: true, name: 'branch_id' })
  branchId?: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch | null;

  // Snapshot de sucursal (inmutabilidad histórica)
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'branch_name' })
  branchName?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'branch_address' })
  branchAddress?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'branch_phone' })
  branchPhone?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'shipping_total', default: '0.00' })
  shippingTotal!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
