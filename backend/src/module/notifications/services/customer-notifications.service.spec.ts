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
      save: jest
        .fn()
        .mockImplementation((entity) =>
          Promise.resolve({ ...entity, id: entity.id || 'new-id' }),
        ),
      create: jest.fn().mockImplementation((dto) => ({
        ...dto,
        id: 'gen-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
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

    service = module.get<CustomerNotificationsService>(
      CustomerNotificationsService,
    );
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

      expect(qb.andWhere).toHaveBeenCalledWith('notification.type = :type', {
        type: NotificationType.ORDER_STATUS_CHANGED,
      });
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
      expect(result.notifications[0].type).toBe(
        NotificationType.ORDER_STATUS_CHANGED,
      );
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

    it('debe filtrar por FAVORITE_PRICE_DROPPED para la pestaña Ofertas', async () => {
      const qb = createMockQueryBuilder([], 0);
      mockNotificationRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(mockCustomerId, {
        type: NotificationType.FAVORITE_PRICE_DROPPED,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('notification.type = :type', {
        type: NotificationType.FAVORITE_PRICE_DROPPED,
      });
    });

    it('debe devolver un arreglo vacío estable y totalPages 0 cuando no existan notificaciones (Empty State)', async () => {
      const qb = createMockQueryBuilder([], 0);
      mockNotificationRepo.createQueryBuilder.mockReturnValue(qb);
      mockNotificationRepo.count.mockResolvedValue(0);

      const result = await service.findAll(mockCustomerId, {});

      expect(result.notifications).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.unreadCount).toBe(0);
      expect(result.meta.limit).toBe(10); // default limit 10
    });

    it('debe aplicar paginación default de 10 y limitar como máximo a 100', async () => {
      const qb = createMockQueryBuilder([], 0);
      mockNotificationRepo.createQueryBuilder.mockReturnValue(qb);

      // Sin query: default limit 10
      await service.findAll(mockCustomerId, {});
      expect(qb.take).toHaveBeenCalledWith(10);

      // Con limit > 100: acota a 100
      await service.findAll(mockCustomerId, { limit: 150 });
      expect(qb.take).toHaveBeenCalledWith(100);
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
    it('debe cortocircuitar y retornar ceros sin consultar GROUP BY cuando unreadCount es 0', async () => {
      mockNotificationRepo.count.mockResolvedValue(0);

      const result = await service.getUnreadCount(mockCustomerId);

      expect(mockNotificationRepo.count).toHaveBeenCalledWith({
        where: { customerId: mockCustomerId, isRead: false },
      });
      expect(mockNotificationRepo.createQueryBuilder).not.toHaveBeenCalled();
      expect(result.unreadCount).toBe(0);
      expect(result.breakdown).toEqual({
        [NotificationType.ORDER_STATUS_CHANGED]: 0,
        [NotificationType.FAVORITE_PRICE_DROPPED]: 0,
        [NotificationType.SYSTEM_ANNOUNCEMENT]: 0,
      });
      expect(result.tabBreakdown).toEqual({
        [NotificationTab.ORDERS]: 0,
        [NotificationTab.OFFERS]: 0,
        [NotificationTab.SYSTEM]: 0,
      });
    });

    it('debe retornar el contador total y el desglose (breakdown) por tipo y pestaña cuando unreadCount > 0', async () => {
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
      expect(mockNotificationRepo.createQueryBuilder).toHaveBeenCalledWith(
        'notification',
      );
      expect(qb.where).toHaveBeenCalledWith(
        'notification.customer_id = :customerId AND notification.is_read = false',
        { customerId: mockCustomerId },
      );
      expect(qb.groupBy).toHaveBeenCalledWith('notification.type');
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

    it('debe mantener aislamiento estricto y no filtrar notificaciones de otros clientes ni leídas', async () => {
      mockNotificationRepo.count.mockResolvedValue(1);
      const qb = createMockQueryBuilder([], 0, [
        { type: NotificationType.ORDER_STATUS_CHANGED, count: '1' },
      ]);
      mockNotificationRepo.createQueryBuilder.mockReturnValue(qb);

      const specificCustomerId = 'customer-tenant-xyz';
      await service.getUnreadCount(specificCustomerId);

      expect(mockNotificationRepo.count).toHaveBeenCalledWith({
        where: { customerId: specificCustomerId, isRead: false },
      });
      expect(qb.where).toHaveBeenCalledWith(
        'notification.customer_id = :customerId AND notification.is_read = false',
        { customerId: specificCustomerId },
      );
    });
  });

  describe('markAsRead', () => {
    it('debe marcar como leída una notificación no leída y asignar readAt actual', async () => {
      const entity = { ...mockNotificationEntity, isRead: false, readAt: null };
      mockNotificationRepo.findOne.mockResolvedValue(entity);

      const result = await service.markAsRead(
        mockCustomerId,
        mockNotificationId,
      );

      expect(mockNotificationRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockNotificationId, customerId: mockCustomerId },
      });
      expect(mockNotificationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockNotificationId,
          isRead: true,
          readAt: expect.any(Date),
        }),
      );
      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);
      expect(result.tab).toBe(NotificationTab.ORDERS);
    });

    it('debe ser estrictamente idempotente si la notificación ya fue leída: no altera readAt y no invoca repo.save', async () => {
      const initialReadDate = new Date('2026-09-08T10:00:00.000Z');
      const entity = {
        ...mockNotificationEntity,
        isRead: true,
        readAt: initialReadDate,
      };
      mockNotificationRepo.findOne.mockResolvedValue(entity);

      const result = await service.markAsRead(
        mockCustomerId,
        mockNotificationId,
      );

      expect(mockNotificationRepo.save).not.toHaveBeenCalled();
      expect(result.isRead).toBe(true);
      expect(result.readAt).toEqual(initialReadDate);
    });

    it('debe lanzar NotFoundException con NOTIFICATION_NOT_FOUND si la notificación no existe', async () => {
      mockNotificationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.markAsRead(mockCustomerId, 'non-existing-id'),
      ).rejects.toThrow(new NotFoundException('NOTIFICATION_NOT_FOUND'));
    });

    it('debe lanzar NotFoundException con NOTIFICATION_NOT_FOUND si la notificación pertenece a otro cliente (protección anti-IDOR)', async () => {
      // Simula que la consulta por (id, customerId) no devuelve resultados porque pertenece a otro cliente
      mockNotificationRepo.findOne.mockImplementation(
        ({ where }: { where: { id: string; customerId: string } }) => {
          if (
            where.id === mockNotificationId &&
            where.customerId === 'different-customer-id'
          ) {
            return Promise.resolve(null);
          }
          return Promise.resolve(mockNotificationEntity);
        },
      );

      await expect(
        service.markAsRead('different-customer-id', mockNotificationId),
      ).rejects.toThrow(new NotFoundException('NOTIFICATION_NOT_FOUND'));
    });
  });

  describe('markAllAsRead', () => {
    it('debe ejecutar un único UPDATE atómico por customerId e isRead=false sin cargar entidades en memoria', async () => {
      mockNotificationRepo.update.mockResolvedValue({ affected: 5 });

      const result = await service.markAllAsRead(mockCustomerId);

      expect(mockNotificationRepo.update).toHaveBeenCalledWith(
        { customerId: mockCustomerId, isRead: false },
        expect.objectContaining({ isRead: true, readAt: expect.any(Date) }),
      );
      expect(mockNotificationRepo.findOne).not.toHaveBeenCalled();
      expect(mockNotificationRepo.save).not.toHaveBeenCalled();
      expect(result).toEqual({ updatedCount: 5 });
    });

    it('debe devolver updatedCount: 0 de forma estable cuando el cliente no tiene notificaciones pendientes', async () => {
      mockNotificationRepo.update.mockResolvedValue({ affected: 0 });

      const result = await service.markAllAsRead(mockCustomerId);

      expect(mockNotificationRepo.update).toHaveBeenCalledWith(
        { customerId: mockCustomerId, isRead: false },
        expect.objectContaining({ isRead: true, readAt: expect.any(Date) }),
      );
      expect(result).toEqual({ updatedCount: 0 });
    });

    it('debe garantizar aislamiento estricto por customerId y no alterar notificaciones de otros clientes', async () => {
      mockNotificationRepo.update.mockResolvedValue({ affected: 2 });
      const isolatedCustomerId = 'isolated-tenant-999';

      await service.markAllAsRead(isolatedCustomerId);

      expect(mockNotificationRepo.update).toHaveBeenCalledWith(
        { customerId: isolatedCustomerId, isRead: false },
        expect.objectContaining({ isRead: true, readAt: expect.any(Date) }),
      );
    });

    it('debe manejar adecuadamente cuando affected es undefined o null devolviendo 0', async () => {
      mockNotificationRepo.update.mockResolvedValue({ affected: undefined });

      const result = await service.markAllAsRead(mockCustomerId);

      expect(result).toEqual({ updatedCount: 0 });
    });
  });

  describe('createOrderStatusNotification (Método Interno)', () => {
    it('debe validar parámetros y persistir notificación ORDER_STATUS_CHANGED utilizando el mapper de estados', async () => {
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
          title: '¡Tu pedido #A7K29P4Q está en camino!',
          message:
            'Tu pedido #A7K29P4Q ha salido hacia tu dirección de entrega.',
          actionUrl: '/cuenta/pedidos/A7K29P4Q',
          metadata: {
            orderNumber: 'A7K29P4Q',
            oldStatus: 'PENDING',
            newStatus: 'ON_ROUTE',
          },
          isRead: false,
          readAt: null,
        }),
      );
      expect(mockNotificationRepo.save).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.type).toBe(NotificationType.ORDER_STATUS_CHANGED);
    });

    it('debe suprimir la creación y retornar null si el estado no cambió (oldStatus === newStatus)', async () => {
      const params = {
        customerId: mockCustomerId,
        orderId: 'ord-uuid-1',
        orderNumber: 'A7K29P4Q',
        oldStatus: 'DELIVERED',
        newStatus: 'DELIVERED',
      };

      const result = await service.createOrderStatusNotification(params);

      expect(result).toBeNull();
      expect(mockNotificationRepo.create).not.toHaveBeenCalled();
      expect(mockNotificationRepo.save).not.toHaveBeenCalled();
    });

    it('debe respetar customTitle y customMessage si se suministran explícitamente', async () => {
      const params = {
        customerId: mockCustomerId,
        orderId: 'ord-uuid-1',
        orderNumber: 'A7K29P4Q',
        oldStatus: 'PENDING',
        newStatus: 'ON_ROUTE',
        customTitle: 'Título Personalizado #A7K29P4Q',
        customMessage: 'Mensaje especial para el cliente.',
      };

      const result = await service.createOrderStatusNotification(params);

      expect(mockNotificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Título Personalizado #A7K29P4Q',
          message: 'Mensaje especial para el cliente.',
        }),
      );
      expect(result).not.toBeNull();
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
