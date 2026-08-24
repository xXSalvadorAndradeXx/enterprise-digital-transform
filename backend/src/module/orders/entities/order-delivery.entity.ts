import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity({ name: 'order_deliveries' })
export class OrderDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Order, (order) => order.delivery)
  order!: Order;

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ type: 'date', nullable: true })
  estimatedDeliveryDate?: Date;

  // Snapshot de dirección para entrega a domicilio
  @Column({ type: 'varchar', length: 100, nullable: true })
  department?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district?: string | null;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}


