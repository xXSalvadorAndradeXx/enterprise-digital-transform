import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerNotification } from '../entities/customer-notification.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationTab } from '../enums/notification-tab.enum';
import {
  getNotificationTab,
  getNotificationTypesForTab,
} from '../constants/notification-category-mapping';
import { NotificationsQueryDto } from '../dto/notifications-query.dto';
import {
  NotificationResponseDto,
  NotificationsPaginationMetaDto,
} from '../dto/notification-response.dto';
import { UnreadCountDataDto } from '../dto/unread-count-response.dto';

export interface CreateOrderStatusNotificationParams {
  customerId: string;
  orderId: string;
  orderNumber: string;
  oldStatus?: string;
  newStatus: string;
  customMessage?: string;
  actionUrl?: string;
}

export interface CreateFavoritePriceDropNotificationParams {
  customerId: string;
  productId: string;
  commercialName: string;
  oldPrice: number;
  newPrice: number;
  customMessage?: string;
  actionUrl?: string;
}

@Injectable()
export class CustomerNotificationsService {
  private readonly logger = new Logger(CustomerNotificationsService.name);

  constructor(
    @InjectRepository(CustomerNotification)
    private readonly notificationRepo: Repository<CustomerNotification>,
  ) {}

  /**
   * Obtiene la lista paginada de notificaciones para el cliente autenticado,
   * aplicando filtros por pestaña (ORDERS, OFFERS, SYSTEM, ALL) y estado de lectura.
  /**
   * Obtiene la lista paginada de notificaciones para el cliente autenticado,
   * aplicando filtros por type opcional, por pestaña (ORDERS, OFFERS, SYSTEM, ALL) y estado de lectura.
   */
  async findAll(
    customerId: string,
    query: NotificationsQueryDto = {},
  ): Promise<{
    notifications: NotificationResponseDto[];
    meta: NotificationsPaginationMetaDto;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const qb = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.customer_id = :customerId', { customerId });

    // 1. Prioridad: Filtrado por type específico si fue provisto
    if (query.type) {
      qb.andWhere('notification.type = :type', { type: query.type });
    } else {
      // 2. Si no hay type, filtrar por pestaña si no es ALL
      const typesForTab = getNotificationTypesForTab(query.tab);
      if (typesForTab && typesForTab.length > 0) {
        qb.andWhere('notification.type IN (:...typesForTab)', { typesForTab });
      }
      // 3. Si no hay type y tab es ALL o undefined, NO se restringe por tipo (trae todas)
    }

    // Filtrado por estado de lectura si fue provisto
    if (query.isRead !== undefined) {
      qb.andWhere('notification.is_read = :isRead', { isRead: query.isRead });
    }

    // Ordenamiento cronológico descendente y paginación
    qb.orderBy('notification.created_at', 'DESC').skip(skip).take(limit);

    const [entities, total] = await qb.getManyAndCount();

    // Contador global de no leídas para insignias
    const unreadCount = await this.notificationRepo.count({
      where: { customerId, isRead: false },
    });

    const totalPages = Math.ceil(total / limit) || 0;

    const notifications =
      entities && entities.length > 0
        ? entities.map((entity) => this.mapToItemResponseDto(entity))
        : [];

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages,
        unreadCount,
      },
    };
  }

  /**
   * Obtiene el contador total de notificaciones no leídas para insignias (Badge Count),
   * incluyendo opcionalmente el desglose por tipo y por pestaña para UI badges.
   */
  async getUnreadCount(customerId: string): Promise<UnreadCountDataDto> {
    // 1. Conteo escalar eficiente en O(1) vía COUNT(*) sobre índice parcial
    const unreadCount = await this.notificationRepo.count({
      where: { customerId, isRead: false },
    });

    const emptyBreakdown = {
      [NotificationType.ORDER_STATUS_CHANGED]: 0,
      [NotificationType.FAVORITE_PRICE_DROPPED]: 0,
      [NotificationType.SYSTEM_ANNOUNCEMENT]: 0,
    };

    const emptyTabBreakdown = {
      [NotificationTab.ORDERS]: 0,
      [NotificationTab.OFFERS]: 0,
      [NotificationTab.SYSTEM]: 0,
    };

    // 2. Optimización de cortocircuito: si no hay no leídas, evitar consulta secundaria GROUP BY
    if (unreadCount === 0) {
      return {
        unreadCount: 0,
        breakdown: emptyBreakdown,
        tabBreakdown: emptyTabBreakdown,
      };
    }

    // 3. Desglose agregado por type sin cargar filas en memoria
    const rawBreakdown = await this.notificationRepo
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where(
        'notification.customer_id = :customerId AND notification.is_read = false',
        { customerId },
      )
      .groupBy('notification.type')
      .getRawMany();

    const breakdown = { ...emptyBreakdown };

    for (const row of rawBreakdown) {
      if (row.type in breakdown) {
        breakdown[row.type as NotificationType] =
          parseInt(String(row.count), 10) || 0;
      }
    }

    const tabBreakdown = {
      [NotificationTab.ORDERS]:
        breakdown[NotificationType.ORDER_STATUS_CHANGED] || 0,
      [NotificationTab.OFFERS]:
        breakdown[NotificationType.FAVORITE_PRICE_DROPPED] || 0,
      [NotificationTab.SYSTEM]:
        breakdown[NotificationType.SYSTEM_ANNOUNCEMENT] || 0,
    };

    return {
      unreadCount,
      breakdown,
      tabBreakdown,
    };
  }

  /**
   * Marca una notificación individual como leída.
   * Valida estrictamente que pertenezca al cliente autenticado para evitar IDOR.
   */
  async markAsRead(
    customerId: string,
    notificationId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, customerId },
    });

    if (!notification) {
      throw new NotFoundException('NOTIFICATION_NOT_FOUND');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
    }

    return this.mapToItemResponseDto(notification);
  }

  /**
   * Marca todas las notificaciones pendientes del cliente autenticado como leídas en lote.
   * Ejecuta una única operación SQL UPDATE atómica sin cargar entidades en memoria Node.js O(1),
   * garantizando aislamiento estricto por customerId y aprovechando el índice parcial unread.
   *
   * @param customerId - Identificador del cliente autenticado (extraído de JWT)
   * @returns Objeto con la cantidad de notificaciones actualizadas ({ updatedCount: number })
   */
  async markAllAsRead(customerId: string): Promise<{ updatedCount: number }> {
    const result = await this.notificationRepo.update(
      { customerId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { updatedCount: result.affected ?? 0 };
  }

  /**
   * MÉTODO INTERNO: Crea y persiste una notificación de cambio de estado de orden.
   * Invocado por listeners o casos de uso de Orders, nunca expuesto por POST público.
   */
  async createOrderStatusNotification(
    params: CreateOrderStatusNotificationParams,
  ): Promise<CustomerNotification> {
    if (
      !params.customerId ||
      !params.orderId ||
      !params.orderNumber ||
      !params.newStatus
    ) {
      throw new BadRequestException(
        'Datos incompletos para crear notificación de cambio de estado de orden',
      );
    }

    const title = `Actualización de pedido #${params.orderNumber}`;
    const message =
      params.customMessage ||
      `Tu pedido #${params.orderNumber} ahora se encuentra en estado ${params.newStatus}.`;
    const actionUrl =
      params.actionUrl || `/cuenta/pedidos/${params.orderNumber}`;

    const metadata: Record<string, any> = {
      orderNumber: params.orderNumber,
      newStatus: params.newStatus,
    };
    if (params.oldStatus) {
      metadata.oldStatus = params.oldStatus;
    }

    const notification = this.notificationRepo.create({
      customerId: params.customerId,
      orderId: params.orderId,
      productId: null,
      type: NotificationType.ORDER_STATUS_CHANGED,
      title,
      message,
      metadata,
      actionUrl,
      isRead: false,
      readAt: null,
    });

    const saved = await this.notificationRepo.save(notification);
    this.logger.log(
      `Notificación de orden creada: id=${saved.id}, customerId=${params.customerId}, order=${params.orderNumber}`,
    );
    return saved;
  }

  /**
   * MÉTODO INTERNO: Crea y persiste una notificación de reducción de precio en un favorito.
   * Invocado por listeners de catálogo / promociones, nunca expuesto por POST público.
   */
  async createFavoritePriceDropNotification(
    params: CreateFavoritePriceDropNotificationParams,
  ): Promise<CustomerNotification> {
    if (
      !params.customerId ||
      !params.productId ||
      !params.commercialName ||
      params.oldPrice === undefined ||
      params.newPrice === undefined
    ) {
      throw new BadRequestException(
        'Datos incompletos para crear notificación de oferta en producto favorito',
      );
    }

    const discountPercentage = Math.max(
      0,
      Math.round(((params.oldPrice - params.newPrice) / params.oldPrice) * 100),
    );

    const title = '¡Bajó de precio un favorito!';
    const message =
      params.customMessage ||
      `"${params.commercialName}" bajó de precio a $${Number(params.newPrice).toFixed(2)} (antes $${Number(params.oldPrice).toFixed(2)}).`;
    const actionUrl = params.actionUrl || `/productos/${params.productId}`;

    const metadata: Record<string, any> = {
      productId: params.productId,
      commercialName: params.commercialName,
      oldPrice: Number(params.oldPrice),
      newPrice: Number(params.newPrice),
      discountPercentage,
    };

    const notification = this.notificationRepo.create({
      customerId: params.customerId,
      orderId: null,
      productId: params.productId,
      type: NotificationType.FAVORITE_PRICE_DROPPED,
      title,
      message,
      metadata,
      actionUrl,
      isRead: false,
      readAt: null,
    });

    const saved = await this.notificationRepo.save(notification);
    this.logger.log(
      `Notificación de precio favorito creada: id=${saved.id}, customerId=${params.customerId}, product=${params.productId}`,
    );
    return saved;
  }

  /**
   * Mapea la entidad CustomerNotification a su DTO enriquecido de respuesta.
   */
  private mapToItemResponseDto(
    entity: CustomerNotification,
  ): NotificationResponseDto {
    const orderRef =
      entity.orderId || entity.metadata?.orderNumber
        ? {
            id: entity.orderId ?? undefined,
            orderNumber: entity.metadata?.orderNumber ?? undefined,
          }
        : null;

    const productRef =
      entity.productId || entity.metadata?.commercialName
        ? {
            id: entity.productId ?? undefined,
            commercialName: entity.metadata?.commercialName ?? undefined,
            price:
              entity.metadata?.newPrice !== undefined
                ? Number(entity.metadata.newPrice)
                : undefined,
          }
        : null;

    return {
      id: entity.id,
      type: entity.type,
      tab: getNotificationTab(entity.type),
      title: entity.title,
      message: entity.message,
      orderRef,
      productRef,
      metadata: entity.metadata ?? null,
      actionUrl: entity.actionUrl ?? null,
      isRead: entity.isRead,
      readAt: entity.readAt ?? null,
      createdAt: entity.createdAt,
    };
  }
}
