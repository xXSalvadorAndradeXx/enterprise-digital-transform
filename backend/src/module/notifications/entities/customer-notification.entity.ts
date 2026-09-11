import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Order } from '../../orders/entities/order.entity';
import { Product } from '../../products/entities/product.entity';
import { NotificationType } from '../enums/notification-type.enum';

/**
 * Entidad de persistencia para notificaciones dirigidas al cliente autenticado.
 * Soporta notificaciones de pedidos, ofertas/favoritos y avisos de sistema,
 * manteniendo relaciones opcionales no bloqueantes ante soft-delete o borrado físico.
 */
@Entity('customer_notifications')
@Index('IDX_customer_notifications_customer_created', [
  'customerId',
  'createdAt',
])
@Index('IDX_customer_notifications_customer_type_created', [
  'customerId',
  'type',
  'createdAt',
])
@Index('IDX_customer_notifications_customer_is_read', ['customerId', 'isRead'])
@Index('IDX_customer_notifications_order_id', ['orderId'])
@Index('IDX_customer_notifications_product_id', ['productId'])
export class CustomerNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Identificador del cliente destinatario (obligatorio)
  @Column({ name: 'customer_id', type: 'uuid', nullable: false })
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  // Relación opcional con Pedidos (nullable, solo para notificaciones de órdenes)
  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId?: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order?: Order | null;

  // Relación opcional con Productos (nullable, solo para alertas de favoritos/ofertas)
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId?: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product?: Product | null;

  // Tipo canónico de notificación
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM_ANNOUNCEMENT,
  })
  type!: NotificationType;

  // Título conciso visible en la campana o tarjeta
  @Column({ type: 'varchar', length: 150, nullable: false })
  title!: string;

  // Mensaje legible detallado
  @Column({ type: 'text', nullable: false })
  message!: string;

  // Contexto no sensible estructurado para navegación o badges
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  // Ruta relativa de navegación directa para el Frontend (ej. /cuenta/pedidos/A7K29P4Q)
  @Column({ name: 'action_url', type: 'varchar', length: 255, nullable: true })
  actionUrl?: string | null;

  // Estado de lectura
  @Column({ name: 'is_read', type: 'boolean', default: false, nullable: false })
  isRead!: boolean;

  // Fecha y hora en que fue marcada como leída
  @Column({ name: 'read_at', type: 'timestamp with time zone', nullable: true })
  readAt?: Date | null;

  // Marcas de tiempo de auditoría
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
