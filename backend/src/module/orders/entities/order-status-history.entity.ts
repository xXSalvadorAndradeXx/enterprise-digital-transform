import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'order_status_history' })
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Relación con la orden
  @ManyToOne(() => Order, (order) => order.statusHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  // Estado anterior (nulo en la creación inicial de la orden)
  @Column({ type: 'enum', enum: OrderStatus, name: 'status_before', nullable: true })
  statusBefore!: OrderStatus | null;

  // Nuevo estado asignado
  @Column({ type: 'enum', enum: OrderStatus, name: 'status_after' })
  statusAfter!: OrderStatus;

  // Actor o usuario que realizó el cambio de estado
  @Column({ type: 'uuid', name: 'changed_by_id', nullable: true })
  changedById!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy!: User | null;

  // Notas o justificación administrativa del cambio
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  // Fecha y hora del cambio de estado
  @CreateDateColumn({ name: 'changed_at' })
  changedAt!: Date;
}

