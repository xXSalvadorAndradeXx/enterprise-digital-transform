import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomerNotificationsService } from './customer-notifications.service';
import { CustomerNotification } from '../entities/customer-notification.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationTab } from '../enums/notification-tab.enum';

describe('CustomerNotificationsService', () => {
  let service: CustomerNotificationsService;
  let mockNotificationRepo: any;

  const mockCustomerId = 'cust-uuid-1111-2222-3333';
  const mockNotificationId = 'notif-uuid-4444-5555-6666';

  const mockNotificationEntity: Partial<CustomerNotification> = {
    id: mockNotificationId,
    customerId: mockCustomerId,
    orderId: 'ord-uuid-1234',
    productId: null,
    type: NotificationType.ORDER_STATUS_CHANGED,
    title: 'Actualización de pedido #A7K29P4Q',
    message: 'Tu pedido ahora está EN RUTA.',
    metadata: { orderNumber: 'A7K29P4Q', newStatus: 'ON_ROUTE' },
    actionUrl: '/cuenta/pedidos/A7K29P4Q',
    isRead: false,
    readAt: null,
    createdAt: new Date('2026-09-08T12:00:00.000Z'),
    updatedAt: new Date('2026-09-08T12:00:00.000Z'),
  };

  const createMockQueryBuilder = (
    entities: any[] = [],
    total = 0,
    rawMany: any[] = [],
  ) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([entities, total]),
    getRawMany: jest.fn().mockResolvedValue(rawMany),
  });

  beforeEach(async () => {
    mockNotificationRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
      count: jest.fn().mockResolvedValue(1),
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, id: entity.id || 'new-id' })),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'gen-id', createdAt: new Date(), updatedAt: new Date() })),
      update: jest.fn().mockResolvedValue({ affected: 3 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerNotificationsService,
        {
          provide: getRepositoryToken(CustomerNotification),
          useValue: mockNotificationRepo,
        },
      ],
    }).compile();

    service = module.get<CustomerNotificationsService>(CustomerNotificationsService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe filtrar prioritariamente por type cuando se especifica en la consulta', async () => {
      const qb = createMockQueryBuilder([mockNotificationEntity], 1);
      mockNotificationRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll(mockCustomerId, {
        type: NotificationType.ORDER_STATUS_CHANGED,
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'notification.type = :type',
        { type: NotificationType.ORDER_STATUS_CHANGED },
      );
      expect(result.notifications[0].orderRef).toEqual({
        id: 'ord-uuid-1234',
        orderNumber: 'A7K29P4Q',
      });
      expect(result.notifications[0].productRef).toBeNull();
    });

    it('debe retornar lista paginada con DTOs enriquecidos con la pestaña tab=ORDERS cuando no se envía type', async () => {
      const qb = createMockQueryBuilder([mockNotificationEntity], 1);
      mockNotificationRepo.createQueryBuilder.mockReturnValue(qb);
      mockNotificationRepo.count.mockResolvedValue(1);

      const result = await service.findAll(mockCustomerId, {
        tab: NotificationTab.ORDERS,
        page: 1,
        limit: 20,
      });

      expect(qb.where).toHaveBeenCalledWith(
        'notification.customer_id = :customerId',
        { customerId: mockCustomerId },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'notification.type IN (:...typesForTab)',
        { typesForTab: [NotificationType.ORDER_STATUS_CHANGED] },
      );
      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].tab).toBe(NotificationTab.ORDERS);
      expect(result.notifications[0].type).toBe(NotificationType.ORDER_STATUS_CHANGED);
      expect(result.meta.total).toBe(1);
      expect(result.meta.unreadCount).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('no debe restringir por tipo cuando no se envía type y tab es ALL', async () => {
      const qb = createMockQueryBuilder([], 0);
      mockNotificationRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockCustomerId, {
        tab: NotificationTab.ALL,
      });

      expect(qb.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('notification.type'),
        expect.anything(),
      );
    });

    it('debe filtrar por isRead cuando se envía en la consulta', async () => {
      const qb = createMockQueryBuilder([], 0);
      mockNotificationRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockCustomerId, {
        tab: NotificationTab.ALL,
        isRead: false,
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'notification.is_read = :isRead',
        { isRead: false },
      );
    });
  });

  describe('getUnreadCount', () => {
    it('debe retornar el contador total y el desglose (breakdown) por tipo y pestaña', async () => {
      mockNotificationRepo.count.mockResolvedValue(4);
      const rawBreakdown = [
        { type: NotificationType.ORDER_STATUS_CHANGED, count: '3' },
        { type: NotificationType.FAVORITE_PRICE_DROPPED, count: '1' },
      ];
      const qb = createMockQueryBuilder([], 0, rawBreakdown);
      mockNotificationRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getUnreadCount(mockCustomerId);

      expect(mockNotificationRepo.count).toHaveBeenCalledWith({
        where: { customerId: mockCustomerId, isRead: false },
      });
      expect(result.unreadCount).toBe(4);
      expect(result.breakdown).toEqual({
        [NotificationType.ORDER_STATUS_CHANGED]: 3,
        [NotificationType.FAVORITE_PRICE_DROPPED]: 1,
        [NotificationType.SYSTEM_ANNOUNCEMENT]: 0,
      });
      expect(result.tabBreakdown).toEqual({
        [NotificationTab.ORDERS]: 3,
        [NotificationTab.OFFERS]: 1,
        [NotificationTab.SYSTEM]: 0,
      });
    });
  });

  describe('markAsRead', () => {
    it('debe marcar como leída una notificación existente y retornar el DTO', async () => {
      const entity = { ...mockNotificationEntity, isRead: false, readAt: null };
      mockNotificationRepo.findOne.mockResolvedValue(entity);

      const result = await service.markAsRead(mockCustomerId, mockNotificationId);

      expect(mockNotificationRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockNotificationId, customerId: mockCustomerId },
      });
      expect(mockNotificationRepo.save).toHaveBeenCalled();
      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);
      expect(result.tab).toBe(NotificationTab.ORDERS);
    });

    it('no debe re-guardar si la notificación ya estaba leída (idempotencia)', async () => {
      const readDate = new Date('2026-09-08T10:00:00.000Z');
      const entity = { ...mockNotificationEntity, isRead: true, readAt: readDate };
      mockNotificationRepo.findOne.mockResolvedValue(entity);

      const result = await service.markAsRead(mockCustomerId, mockNotificationId);

      expect(mockNotificationRepo.save).not.toHaveBeenCalled();
      expect(result.isRead).toBe(true);
      expect(result.readAt).toBe(readDate);
    });

    it('debe lanzar NotFoundException si la notificación no existe o pertenece a otro cliente', async () => {
      mockNotificationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.markAsRead(mockCustomerId, 'non-existing-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllAsRead', () => {
    it('debe actualizar en lote todas las no leídas del cliente', async () => {
      mockNotificationRepo.update.mockResolvedValue({ affected: 5 });

      const result = await service.markAllAsRead(mockCustomerId);

      expect(mockNotificationRepo.update).toHaveBeenCalledWith(
        { customerId: mockCustomerId, isRead: false },
        expect.objectContaining({ isRead: true, readAt: expect.any(Date) }),
      );
      expect(result).toEqual({ updatedCount: 5 });
    });
  });

  describe('createOrderStatusNotification (Método Interno)', () => {
    it('debe validar parámetros y persistir notificación ORDER_STATUS_CHANGED', async () => {
      const params = {
        customerId: mockCustomerId,
        orderId: 'ord-uuid-1',
        orderNumber: 'A7K29P4Q',
        oldStatus: 'PENDING',
        newStatus: 'ON_ROUTE',
      };

      const result = await service.createOrderStatusNotification(params);

      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: mockCustomerId,
          orderId: 'ord-uuid-1',
          productId: null,
          type: NotificationType.ORDER_STATUS_CHANGED,
          title: 'Actualización de pedido #A7K29P4Q',
          actionUrl: '/cuenta/pedidos/A7K29P4Q',
          metadata: {
            orderNumber: 'A7K29P4Q',
            oldStatus: 'PENDING',
            newStatus: 'ON_ROUTE',
          },
          isRead: false,
        }),
      );
      expect(mockNotificationRepo.save).toHaveBeenCalled();
      expect(result.type).toBe(NotificationType.ORDER_STATUS_CHANGED);
    });

    it('debe lanzar BadRequestException ante parámetros requeridos faltantes', async () => {
      await expect(
        service.createOrderStatusNotification({
          customerId: '',
          orderId: '',
          orderNumber: '',
          newStatus: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createFavoritePriceDropNotification (Método Interno)', () => {
    it('debe calcular descuento y persistir notificación FAVORITE_PRICE_DROPPED', async () => {
      const params = {
        customerId: mockCustomerId,
        productId: 'prod-uuid-99',
        commercialName: 'Taladro Percutor 1/2',
        oldPrice: 100,
        newPrice: 75,
      };

      const result = await service.createFavoritePriceDropNotification(params);

      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: mockCustomerId,
          orderId: null,
          productId: 'prod-uuid-99',
          type: NotificationType.FAVORITE_PRICE_DROPPED,
          title: '¡Bajó de precio un favorito!',
          actionUrl: '/productos/prod-uuid-99',
          metadata: {
            productId: 'prod-uuid-99',
            commercialName: 'Taladro Percutor 1/2',
            oldPrice: 100,
            newPrice: 75,
            discountPercentage: 25,
          },
          isRead: false,
        }),
      );
      expect(mockNotificationRepo.save).toHaveBeenCalled();
      expect(result.type).toBe(NotificationType.FAVORITE_PRICE_DROPPED);
    });

    it('debe lanzar BadRequestException ante parámetros requeridos faltantes', async () => {
      await expect(
        service.createFavoritePriceDropNotification({
          customerId: '',
          productId: '',
          commercialName: '',
          oldPrice: undefined as any,
          newPrice: undefined as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
