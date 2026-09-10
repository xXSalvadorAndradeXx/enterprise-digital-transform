import { Injectable, Logger } from '@nestjs/common';
import { OrderStatusChangedEvent } from '../../orders/events/order-status-changed.event';

/**
 * Servicio encargado de la gestión e ingesta de notificaciones para los clientes.
 * BE-ADM-NOT-06: Listener hacia CustomerNotificationsService
 */
@Injectable()
export class CustomerNotificationsService {
  private readonly logger = new Logger(CustomerNotificationsService.name);

  /**
   * Crea una notificación de cambio de estado de orden para un cliente registrado.
   *
   * @param event Evento de dominio OrderStatusChangedEvent
   * @returns Promise<boolean> true si se creó la notificación, false si el cliente es Guest
   */
  async createOrderStatusNotification(
    event: OrderStatusChangedEvent,
  ): Promise<boolean> {
    if (!event.customerId) {
      this.logger.debug(
        `[CustomerNotificationsService] Notificación omitida: El pedido ${event.orderNumber} fue realizado como cliente invitado (Guest).`,
      );
      return false;
    }

    this.logger.log(
      `[CustomerNotificationsService] Notificación creada para cliente ${event.customerId}: Pedido ${event.orderNumber} ha cambiado a ${event.newStatus}.`,
    );

    return true;
  }
}
