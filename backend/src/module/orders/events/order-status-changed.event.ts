import { OrderStatus } from '../enums/order-status.enum';

/**
 * Evento de dominio emitido cuando cambia el estado de una orden.
 * 
 * BE-ADM-NOT-02: Definir/reutilizar OrderStatusChangedEvent
 */
export class OrderStatusChangedEvent {
  /**
   * UUID único del evento para garantizar la idempotencia en el procesamiento de eventos.
   */
  readonly eventId: string;

  /**
   * Identificador único (UUID) de la orden en la base de datos.
   */
  readonly orderId: string;

  /**
   * Código alfanumérico público de 8 caracteres visible por el cliente (ej. 'AB12CD34').
   */
  readonly orderNumber: string;

  /**
   * ID del cliente autenticado (UUID). Null si la orden fue realizada por un cliente invitado (Guest).
   */
  readonly customerId: string | null;

  /**
   * Estado previo de la orden antes de la transición (Enum canónico OrderStatus).
   */
  readonly previousStatus: OrderStatus;

  /**
   * Nuevo estado al que transicionó la orden (Enum canónico OrderStatus).
   */
  readonly newStatus: OrderStatus;

  /**
   * ID del usuario administrativo o sistema que realizó el cambio de estado.
   */
  readonly changedById?: string | null;

  /**
   * Estampa de tiempo (Timestamp) en la que se efectuó la transición.
   */
  readonly changedAt: Date;

  constructor(payload: {
    eventId?: string;
    orderId: string;
    orderNumber: string;
    customerId: string | null;
    previousStatus: OrderStatus;
    newStatus: OrderStatus;
    changedById?: string | null;
    changedAt?: Date;
  }) {
    this.eventId = payload.eventId ?? crypto.randomUUID();
    this.orderId = payload.orderId;
    this.orderNumber = payload.orderNumber;
    this.customerId = payload.customerId;
    this.previousStatus = payload.previousStatus;
    this.newStatus = payload.newStatus;
    this.changedById = payload.changedById ?? null;
    this.changedAt = payload.changedAt ?? new Date();
  }
}
