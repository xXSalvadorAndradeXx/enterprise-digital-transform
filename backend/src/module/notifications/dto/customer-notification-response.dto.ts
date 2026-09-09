import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationTab } from '../enums/notification-tab.enum';

export class CustomerNotificationItemResponseDto {
  @ApiProperty({
    description: 'Identificador único de la notificación (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Tipo de evento de notificación',
    enum: NotificationType,
    example: NotificationType.ORDER_STATUS_CHANGED,
  })
  type!: NotificationType;

  @ApiProperty({
    description: 'Pestaña canónica asociada en Frontend',
    enum: NotificationTab,
    example: NotificationTab.ORDERS,
  })
  tab!: NotificationTab;

  @ApiProperty({
    description: 'Título conciso de la notificación',
    example: 'Tu pedido #A7K29P4Q ha cambiado de estado',
  })
  title!: string;

  @ApiProperty({
    description: 'Mensaje legible con detalles del evento',
    example: 'Tu pedido ahora se encuentra EN RUTA.',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Identificador de la orden asociada si aplica',
    example: 'd8c23d4e-b5f7-4c07-96a8-a28efbc2e541',
    nullable: true,
  })
  orderId?: string | null;

  @ApiPropertyOptional({
    description: 'Identificador del producto asociado si aplica',
    example: 'f5262ea1-7703-474c-90be-e6d896a822c5',
    nullable: true,
  })
  productId?: string | null;

  @ApiPropertyOptional({
    description: 'Referencia mínima normalizada de la orden asociada si aplica',
    example: {
      id: 'd8c23d4e-b5f7-4c07-96a8-a28efbc2e541',
      orderNumber: 'A7K29P4Q',
    },
    nullable: true,
  })
  orderRef?: { id?: string; orderNumber?: string } | null;

  @ApiPropertyOptional({
    description:
      'Referencia mínima normalizada del producto asociado si aplica',
    example: {
      id: 'f5262ea1-7703-474c-90be-e6d896a822c5',
      commercialName: 'Taladro Percutor',
      price: 70.0,
    },
    nullable: true,
  })
  productRef?: { id?: string; commercialName?: string; price?: number } | null;

  @ApiPropertyOptional({
    description:
      'Metadatos no sensibles estructurados de la notificación (número de orden, precios, etc.)',
    example: { orderNumber: 'A7K29P4Q', newStatus: 'ON_ROUTE' },
    nullable: true,
  })
  metadata?: Record<string, any> | null;

  @ApiPropertyOptional({
    description: 'Ruta de navegación profunda en la app del cliente',
    example: '/cuenta/pedidos/A7K29P4Q',
    nullable: true,
  })
  actionUrl?: string | null;

  @ApiProperty({
    description: 'Indica si la notificación ya fue leída',
    example: false,
  })
  isRead!: boolean;

  @ApiPropertyOptional({
    description: 'Fecha y hora en que la notificación fue leída',
    example: '2026-09-08T20:30:00.000Z',
    nullable: true,
  })
  readAt?: Date | null;

  @ApiProperty({
    description: 'Fecha y hora de creación de la notificación',
    example: '2026-09-08T19:45:00.000Z',
  })
  createdAt!: Date;
}

export class CustomerNotificationsPaginationMetaDto {
  @ApiProperty({
    description: 'Total de notificaciones encontradas',
    example: 42,
  })
  total!: number;

  @ApiProperty({ description: 'Página actual', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Cantidad de elementos por página', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Total de páginas disponibles', example: 3 })
  totalPages!: number;

  @ApiProperty({
    description: 'Total global de notificaciones no leídas para el cliente',
    example: 5,
  })
  unreadCount!: number;
}

export class PaginatedCustomerNotificationsDataDto {
  @ApiProperty({
    description: 'Lista de notificaciones del cliente',
    type: [CustomerNotificationItemResponseDto],
  })
  notifications!: CustomerNotificationItemResponseDto[];

  @ApiProperty({
    description: 'Metadatos de paginación y conteo',
    type: CustomerNotificationsPaginationMetaDto,
  })
  meta!: CustomerNotificationsPaginationMetaDto;
}

export class PaginatedCustomerNotificationsResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: PaginatedCustomerNotificationsDataDto })
  data!: PaginatedCustomerNotificationsDataDto;
}

export class CustomerNotificationWrappedResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: CustomerNotificationItemResponseDto })
  data!: CustomerNotificationItemResponseDto;
}

export {
  UnreadCountDataDto,
  UnreadCountResponseDto,
} from './unread-count-response.dto';

export class MarkAllAsReadDataDto {
  @ApiProperty({
    description: 'Cantidad de notificaciones actualizadas a leídas',
    example: 7,
  })
  updatedCount!: number;
}

export class MarkAllAsReadResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: MarkAllAsReadDataDto })
  data!: MarkAllAsReadDataDto;
}
