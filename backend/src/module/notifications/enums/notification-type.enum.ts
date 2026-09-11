/**
 * Tipos canónicos de eventos y notificaciones para clientes.
 * Cada tipo se mapea explícitamente a una pestaña (tab) del Frontend.
 */
export enum NotificationType {
  /**
   * Actualización en el estado de un pedido del cliente.
   * Pertenece a la pestaña "Pedidos" (ORDERS).
   */
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',

  /**
   * Notificación de descuento o reducción de precio en un producto marcado como favorito.
   * Pertenece a la pestaña "Ofertas" (OFFERS).
   */
  FAVORITE_PRICE_DROPPED = 'FAVORITE_PRICE_DROPPED',

  /**
   * Comunicado general, alerta de seguridad o aviso del sistema.
   * Pertenece a la pestaña "Sistema" (SYSTEM).
   */
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}
