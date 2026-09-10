import { Injectable, Logger } from '@nestjs/common';
import { OrderStatusChangedEvent } from '../../orders/events/order-status-changed.event';
import { OrderStatusMessageMapper } from '../../orders/mappers/order-status-message.mapper';

/**
 * Servicio encargado de la gestión e ingesta de notificaciones para los clientes.
 * BE-ADM-NOT-06 / BE-ADM-NOT-07
 */
@Injectable()
export class CustomerNotificationsService {
  private readonly logger = new Logger(CustomerNotificationsService.name);

  /**
   * Crea una notificación de cambio de estado de orden para un cliente registrado.
   *
   * @param event Evento de dominio OrderStatusChangedEvent
   * @returns Promise<{ success: boolean; title?: string; message?: string }> Resultado de la ingesta
   */
  async createOrderStatusNotification(
    event: OrderStatusChangedEvent,
  ): Promise<{ success: boolean; title?: string; message?: string }> {
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

    this.logger.log(
      `[CustomerNotificationsService] Notificación creada para cliente ${event.customerId}: [${title}] ${message}`,
    );

    return {
      success: true,
      title,
      message,
    };
  }
}
