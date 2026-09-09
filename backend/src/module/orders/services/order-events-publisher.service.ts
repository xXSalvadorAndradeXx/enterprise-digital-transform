import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';
import { ORDER_STATUS_CHANGED } from '../constants/order-events.constants';

/**
 * Publisher de eventos de dominio para el módulo de órdenes.
 * BE-ADM-NOT-05: Publicar ORDER_STATUS_CHANGED una sola vez.
 */
@Injectable()
export class OrderEventsPublisherService {
  private readonly logger = new Logger(OrderEventsPublisherService.name);

  // Stream RxJS para transmisión en memoria desacoplada del evento
  private readonly statusChangedSubject = new Subject<OrderStatusChangedEvent>();

  // Caché de eventId para evitar doble emisión en reintentos internos
  private readonly processedEventIds = new Set<string>();

  /**
   * Observable público para suscriptores del evento ORDER_STATUS_CHANGED.
   */
  get onOrderStatusChanged$(): Observable<OrderStatusChangedEvent> {
    return this.statusChangedSubject.asObservable();
  }

  /**
   * Publica el evento ORDER_STATUS_CHANGED una sola vez por transición efectiva.
   *
   * @param event Instancia del evento tipado OrderStatusChangedEvent
   * @returns boolean Indica si el evento fue emitido (true) o si fue ignorado por duplicidad (false)
   */
  publishOrderStatusChanged(event: OrderStatusChangedEvent): boolean {
    if (!event || !event.eventId) {
      this.logger.warn('Intento de publicar evento inválido o sin eventId');
      return false;
    }

    // Evitar doble emisión por reintento interno
    if (this.processedEventIds.has(event.eventId)) {
      this.logger.debug(
        `[${ORDER_STATUS_CHANGED}] Evento omitido por duplicidad en publisher. eventId=${event.eventId}`,
      );
      return false;
    }

    this.processedEventIds.add(event.eventId);

    // Mantenimiento preventivo del Set para controlar memoria
    if (this.processedEventIds.size > 5000) {
      const firstItem = this.processedEventIds.values().next().value;
      if (firstItem) {
        this.processedEventIds.delete(firstItem);
      }
    }

    // Logging estructurado y seguro (sin PII ni tokens sensibles)
    this.logger.log(
      `[${ORDER_STATUS_CHANGED}] Evento publicado. eventId=${event.eventId} orderNumber=${event.orderNumber} transition=${event.previousStatus}->${event.newStatus} customerId=${event.customerId ?? 'GUEST'}`,
    );

    // Emitir el evento a los observadores
    this.statusChangedSubject.next(event);
    return true;
  }
}
