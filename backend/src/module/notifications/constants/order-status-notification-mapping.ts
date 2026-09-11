import { OrderStatus } from '../../orders/enums/order-status.enum';

export interface OrderStatusNotificationText {
  title: string;
  message: string;
}

/**
 * Plantillas predefinidas de redacción para notificaciones de cambio de estado de pedidos.
 * Proporcionan mensajes empáticos, claros y estandarizados para el cliente.
 */
export const ORDER_STATUS_NOTIFICATION_TEMPLATES: Record<
  OrderStatus,
  (orderNumber: string) => OrderStatusNotificationText
> = {
  [OrderStatus.NEW]: (orderNumber: string) => ({
    title: `Pedido registrado #${orderNumber}`,
    message: `Hemos recibido tu pedido #${orderNumber}. Estamos procesando tu compra.`,
  }),
  [OrderStatus.PENDING]: (orderNumber: string) => ({
    title: `Pedido pendiente #${orderNumber}`,
    message: `Tu pedido #${orderNumber} está pendiente de confirmación o pago.`,
  }),
  [OrderStatus.ON_ROUTE]: (orderNumber: string) => ({
    title: `¡Tu pedido #${orderNumber} está en camino!`,
    message: `Tu pedido #${orderNumber} ha salido hacia tu dirección de entrega.`,
  }),
  [OrderStatus.READY_FOR_PICKUP]: (orderNumber: string) => ({
    title: `Pedido listo para retiro #${orderNumber}`,
    message: `Tu pedido #${orderNumber} ya está disponible para retirar en sucursal.`,
  }),
  [OrderStatus.DELIVERED]: (orderNumber: string) => ({
    title: `Pedido entregado #${orderNumber}`,
    message: `Tu pedido #${orderNumber} ha sido entregado exitosamente. ¡Gracias por tu compra!`,
  }),
  [OrderStatus.CANCELLED]: (orderNumber: string) => ({
    title: `Pedido cancelado #${orderNumber}`,
    message: `Tu pedido #${orderNumber} ha sido cancelado. Si tienes dudas, contáctanos.`,
  }),
};

/**
 * Retorna el título y mensaje estandarizado para una notificación según el estado del pedido.
 * Si el estado no coincide con ninguna plantilla predefinida, utiliza un fallback seguro.
 *
 * @param orderNumber - Código legible del pedido (ej. 'A7K29P4Q')
 * @param status - Estado del pedido (OrderStatus o string compatible)
 * @returns Textos de título y mensaje formateados
 */
export function getOrderStatusNotificationText(
  orderNumber: string,
  status: OrderStatus | string,
): OrderStatusNotificationText {
  const template = ORDER_STATUS_NOTIFICATION_TEMPLATES[status as OrderStatus];
  if (template) {
    return template(orderNumber);
  }

  return {
    title: `Actualización de pedido #${orderNumber}`,
    message: `Tu pedido #${orderNumber} ahora se encuentra en estado ${status}.`,
  };
}
