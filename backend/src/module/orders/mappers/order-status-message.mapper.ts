import { OrderStatus } from '../enums/order-status.enum';

/**
 * Interfaz con la estructura estandarizada para notificaciones de cliente.
 */
export interface OrderStatusNotificationContent {
  title: string;
  message: string;
}

/**
 * Mapper testeable encargado de mapear cada estado de la orden (OrderStatus)
 * a su correspondiente título y mensaje amigable para el cliente.
 * 
 * BE-ADM-NOT-07: Catálogo de mensajes por OrderStatus
 */
export class OrderStatusMessageMapper {
  private static readonly STABLE_TITLE = 'Actualización de tu pedido';

  /**
   * Mapea un estado de orden y número de pedido a su contenido amigable.
   *
   * @param status Estado de la orden (OrderStatus enum)
   * @param orderNumber Identificador público de 8 caracteres de la orden
   * @returns OrderStatusNotificationContent Objeto con título y mensaje formatetado
   */
  public static mapStatusToNotification(
    status: OrderStatus | string,
    orderNumber: string,
  ): OrderStatusNotificationContent {
    const cleanOrderNumber = orderNumber ? orderNumber.trim() : '';

    switch (status) {
      case OrderStatus.NEW:
        return {
          title: this.STABLE_TITLE,
          message: `Tu pedido #${cleanOrderNumber} ha sido registrado correctamente.`,
        };

      case OrderStatus.PENDING:
        return {
          title: this.STABLE_TITLE,
          message: `Tu pedido #${cleanOrderNumber} está siendo procesado y preparado.`,
        };

      case OrderStatus.ON_ROUTE:
        return {
          title: this.STABLE_TITLE,
          message: `Tu pedido #${cleanOrderNumber} está en camino a tu dirección de entrega.`,
        };

      case OrderStatus.READY_FOR_PICKUP:
        return {
          title: this.STABLE_TITLE,
          message: `Tu pedido #${cleanOrderNumber} está listo para ser retirado en sucursal.`,
        };

      case OrderStatus.DELIVERED:
        return {
          title: this.STABLE_TITLE,
          message: `Tu pedido #${cleanOrderNumber} ha sido entregado exitosamente. ¡Gracias por tu compra!`,
        };

      case OrderStatus.CANCELLED:
        return {
          title: this.STABLE_TITLE,
          message: `Tu pedido #${cleanOrderNumber} ha sido cancelado.`,
        };

      default:
        // Fallback controlado para estados futuros o no contemplados
        return {
          title: this.STABLE_TITLE,
          message: `El estado de tu pedido #${cleanOrderNumber} ha sido actualizado a ${status}.`,
        };
    }
  }
}
