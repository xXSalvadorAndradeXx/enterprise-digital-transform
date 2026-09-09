import { NotificationType } from '../enums/notification-type.enum';
import { NotificationTab } from '../enums/notification-tab.enum';

/**
 * Mapeo canónico exhaustivo de cada NotificationType a su pestaña (tab) correspondiente.
 * Evita que el Frontend deba deducir la pestaña mediante inspección de texto en el mensaje.
 */
export const NOTIFICATION_TYPE_TO_TAB: Readonly<
  Record<NotificationType, NotificationTab>
> = {
  [NotificationType.ORDER_STATUS_CHANGED]: NotificationTab.ORDERS,
  [NotificationType.FAVORITE_PRICE_DROPPED]: NotificationTab.OFFERS,
  [NotificationType.SYSTEM_ANNOUNCEMENT]: NotificationTab.SYSTEM,
};

/**
 * Mapeo inverso de pestaña (tab) a la lista de NotificationType asociados.
 * Utilizado para filtrar eficientemente en base de datos mediante WHERE type IN (...).
 */
export const NOTIFICATION_TAB_TO_TYPES: Readonly<
  Record<Exclude<NotificationTab, NotificationTab.ALL>, NotificationType[]>
> = {
  [NotificationTab.ORDERS]: [NotificationType.ORDER_STATUS_CHANGED],
  [NotificationTab.OFFERS]: [NotificationType.FAVORITE_PRICE_DROPPED],
  [NotificationTab.SYSTEM]: [NotificationType.SYSTEM_ANNOUNCEMENT],
};

/**
 * Resuelve la pestaña (NotificationTab) correspondiente para un tipo de notificación dado.
 * Garantiza fallback seguro a NotificationTab.SYSTEM si se recibe un tipo no reconocido.
 *
 * @param type - Tipo de notificación
 * @returns NotificationTab correspondiente
 */
export function getNotificationTab(
  type: string | NotificationType,
): NotificationTab {
  if (!type) {
    return NotificationTab.SYSTEM;
  }

  const normalized = type as NotificationType;
  return NOTIFICATION_TYPE_TO_TAB[normalized] ?? NotificationTab.SYSTEM;
}

/**
 * Retorna los tipos de notificación asociados a una pestaña para filtrado en BD.
 * Si la pestaña es ALL o indefinida, retorna null indicando que no se debe aplicar filtro de tipo.
 *
 * @param tab - Pestaña consultada
 * @returns Array de NotificationType a filtrar o null si aplica a todas
 */
export function getNotificationTypesForTab(
  tab?: NotificationTab | string | null,
): NotificationType[] | null {
  if (!tab || tab === NotificationTab.ALL) {
    return null;
  }

  const tabKey = tab as Exclude<NotificationTab, NotificationTab.ALL>;
  return NOTIFICATION_TAB_TO_TYPES[tabKey] ?? null;
}
