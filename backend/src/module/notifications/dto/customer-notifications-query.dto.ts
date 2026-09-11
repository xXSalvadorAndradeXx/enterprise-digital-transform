import { NotificationsQueryDto } from './notifications-query.dto';

/**
 * DTO de consulta para notificaciones de clientes.
 * Hereda todas las capacidades de NotificationsQueryDto (filtros por type, tab, isRead, paginación).
 */
export class CustomerNotificationsQueryDto extends NotificationsQueryDto {}
