import { Injectable, Logger } from '@nestjs/common';
import { OrderStatusChangedEvent } from '../../orders/events/order-status-changed.event';
import { OrderStatusMessageMapper } from '../../orders/mappers/order-status-message.mapper';
import { ORDER_STATUS_CHANGED } from '../../orders/constants/order-events.constants';

export interface CustomerNotificationItem {
  id: string;
  customerId: string;
  type: string;
  title: string;
  message: string;
  orderNumber: string;
  createdAt: Date;
}

/**
 * Servicio encargado de la gestión, almacenamiento e ingesta de notificaciones para los clientes.
 * BE-ADM-NOT-06 / BE-ADM-NOT-07 / BE-ADM-NOT-10
 */
@Injectable()
export class CustomerNotificationsService {
  private readonly logger = new Logger(CustomerNotificationsService.name);

  // Registro de notificaciones de clientes en memoria
  private readonly notificationsStore: CustomerNotificationItem[] = [];

  /**
   * Crea una notificación de cambio de estado de orden para un cliente registrado.
   *
   * @param event Evento de dominio OrderStatusChangedEvent
   */
  async createOrderStatusNotification(
    event: OrderStatusChangedEvent,
  ): Promise<{ success: boolean; notification?: CustomerNotificationItem }> {
    if (!event.customerId) {
      this.logger.debug(
        `[CustomerNotificationsService] Notificación omitida: El pedido ${event.orderNumber} fue realizado como cliente invitado (Guest).`,
      );
      return { success: false };
    }

    const { title, message } = OrderStatusMessageMapper.mapStatusToNotification(
      event.newStatus,
      event.orderNumber,
    );

    const newNotification: CustomerNotificationItem = {
      id: crypto.randomUUID(),
      customerId: event.customerId,
      type: ORDER_STATUS_CHANGED,
      title,
      message,
      orderNumber: event.orderNumber,
      createdAt: new Date(),
    };

    this.notificationsStore.unshift(newNotification);

    this.logger.log(
      `[CustomerNotificationsService] Notificación creada para cliente ${event.customerId}: [${title}] ${message}`,
    );

    return {
      success: true,
      notification: newNotification,
    };
  }

  /**
   * Consulta las notificaciones del cliente autenticado.
   *
   * @param customerId ID del cliente autenticado
   * @param type Filtro por tipo de notificación (opcional)
   */
  async getCustomerNotifications(
    customerId: string,
    type?: string,
  ): Promise<{ count: number; notifications: CustomerNotificationItem[] }> {
    let items = this.notificationsStore.filter(
      (n) => n.customerId === customerId,
    );

    if (type) {
      items = items.filter((n) => n.type === type);
    }

    return {
      count: items.length,
      notifications: items,
    };
  }
}
