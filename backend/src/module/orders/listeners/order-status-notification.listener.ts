import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Subscription } from 'rxjs';
import { OrderEventsPublisherService } from '../services/order-events-publisher.service';
import { CustomerNotificationsService } from '../../customers/services/customer-notifications.service';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';

/**
 * Listener que escucha los eventos ORDER_STATUS_CHANGED e invoca
 * el servicio de notificaciones de clientes desacopladamente.
 * 
 * BE-ADM-NOT-06: Listener hacia CustomerNotificationsService
 */
@Injectable()
export class OrderStatusNotificationListener
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(OrderStatusNotificationListener.name);
  private subscription?: Subscription;

  constructor(
    private readonly orderEventsPublisher: OrderEventsPublisherService,
    private readonly customerNotificationsService: CustomerNotificationsService,
  ) {}

  onModuleInit() {
    this.subscription =
      this.orderEventsPublisher.onOrderStatusChanged$.subscribe({
        next: (event: OrderStatusChangedEvent) => {
          this.handleOrderStatusChanged(event).catch((err) => {
            this.logger.error(
              `Error no controlado al procesar evento de notificación orderNumber=${event.orderNumber}`,
              err,
            );
          });
        },
        error: (err) => {
          this.logger.error(
            'Error crítico en la suscripción de eventos de estado de orden',
            err,
          );
        },
      });
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
  }

  /**
   * Manejador desacoplado del evento order.status_changed
   *
   * @param event Instancia de OrderStatusChangedEvent
   * @returns Promise<boolean> Indica si la notificación fue procesada o ignorada
   */
  async handleOrderStatusChanged(
    event: OrderStatusChangedEvent,
  ): Promise<boolean> {
    // 1. Caso Guest: customerId nulo -> No crear notificación
    if (!event.customerId) {
      this.logger.debug(
        `[OrderStatusNotificationListener] Notificación omitida para compra guest. orderNumber=${event.orderNumber}`,
      );
      return false;
    }

    try {
      // 2. Invocar createOrderStatusNotification (Sin repetir la máquina de estados)
      await this.customerNotificationsService.createOrderStatusNotification(
        event,
      );
      return true;
    } catch (error: any) {
      // 3. Manejo aislado de fallos: No bloquea ni altera la respuesta de la orden
      this.logger.error(
        `[OrderStatusNotificationListener] Fallo al crear notificación para orderNumber=${event.orderNumber} customerId=${event.customerId}`,
        error.stack,
      );
      return false;
    }
  }
}
