/**
 * Pestañas (tabs) soportadas en la interfaz de notificaciones del cliente.
 * Permite filtrar notificaciones en servidor o agrupar en cliente sin depender del texto.
 */
export enum NotificationTab {
  /**
   * Todas las notificaciones sin filtrar por pestaña.
   */
  ALL = 'ALL',

  /**
   * Notificaciones relativas a pedidos y compras (ej. ORDER_STATUS_CHANGED).
   */
  ORDERS = 'ORDERS',

  /**
   * Notificaciones relativas a promociones y descuentos (ej. FAVORITE_PRICE_DROPPED).
   */
  OFFERS = 'OFFERS',

  /**
   * Notificaciones relativas a la plataforma, cuenta o avisos generales (ej. SYSTEM_ANNOUNCEMENT).
   */
  SYSTEM = 'SYSTEM',
}
