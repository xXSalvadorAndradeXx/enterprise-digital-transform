import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomerNotificationsController } from './customer-notifications.controller';
import { CustomerNotificationsService } from '../services/customer-notifications.service';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationTab } from '../enums/notification-tab.enum';
import type { CurrentCustomerPayload } from '../../customers/decorators/current-customer.decorator';

describe('CustomerNotificationsController', () => {
  let controller: CustomerNotificationsController;
  let service: CustomerNotificationsService;

  const mockCustomerPayload: CurrentCustomerPayload = {
    id: 'cust-uuid-1234-5678',
    customerId: 'cust-uuid-1234-5678',
    email: 'cliente@example.com',
    fullName: 'Juan Perez',
    type: 'CUSTOMER',
  };

  const mockNotificationItem = {
    id: 'notif-uuid-1',
    type: NotificationType.ORDER_STATUS_CHANGED,
    tab: NotificationTab.ORDERS,
    title: 'Actualización de orden',
    message: 'Tu orden está en camino',
    orderId: 'ord-1',
    productId: null,
    metadata: { orderNumber: 'A7K29P4Q' },
    actionUrl: '/cuenta/pedidos/A7K29P4Q',
    isRead: false,
    readAt: null,
    createdAt: new Date('2026-09-08T10:00:00.000Z'),
  };

  const mockService = {
    findAll: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerNotificationsController],
      providers: [
        {
          provide: CustomerNotificationsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CustomerNotificationsController>(
      CustomerNotificationsController,
    );
    service = module.get<CustomerNotificationsService>(
      CustomerNotificationsService,
    );
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /customers/me/notifications', () => {
    it('debe invocar findAll con el customer.id y query suministrada', async () => {
      mockService.findAll.mockResolvedValue({
        notifications: [mockNotificationItem],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1, unreadCount: 1 },
      });

      const query = { tab: NotificationTab.ORDERS, page: 1, limit: 20 };
      const response = await controller.getMyNotifications(
        mockCustomerPayload,
        query,
      );

      expect(service.findAll).toHaveBeenCalledWith(
        mockCustomerPayload.id,
        query,
      );
      expect(response.success).toBe(true);
      expect(response.data.notifications).toHaveLength(1);
      expect(response.data.meta.unreadCount).toBe(1);
    });
  });

  describe('GET /customers/me/notifications/unread-count', () => {
    it('debe retornar el unreadCount obtenido del servicio', async () => {
      mockService.getUnreadCount.mockResolvedValue({ unreadCount: 3 });

      const response = await controller.getUnreadCount(mockCustomerPayload);

      expect(service.getUnreadCount).toHaveBeenCalledWith(
        mockCustomerPayload.id,
      );
      expect(response).toEqual({
        success: true,
        data: { unreadCount: 3 },
      });
    });
  });

  describe('PATCH /customers/me/notifications/:id/read', () => {
    it('debe invocar markAsRead con customer.id e id de notificación', async () => {
      mockService.markAsRead.mockResolvedValue({
        ...mockNotificationItem,
        isRead: true,
        readAt: new Date(),
      });

      const notifId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await controller.markAsRead(
        mockCustomerPayload,
        notifId,
      );

      expect(service.markAsRead).toHaveBeenCalledWith(
        mockCustomerPayload.id,
        notifId,
      );
      expect(response.success).toBe(true);
      expect(response.data.isRead).toBe(true);
    });

    it('debe propagar NotFoundException si la notificación no existe o es ajena', async () => {
      mockService.markAsRead.mockRejectedValue(
        new NotFoundException('NOTIFICATION_NOT_FOUND'),
      );

      const notifId = '550e8400-e29b-41d4-a716-446655440000';
      await expect(
        controller.markAsRead(mockCustomerPayload, notifId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /customers/me/notifications/read-all', () => {
    it('debe invocar markAllAsRead con customer.id y retornar updatedCount', async () => {
      mockService.markAllAsRead.mockResolvedValue({ updatedCount: 4 });

      const response = await controller.markAllAsRead(mockCustomerPayload);

      expect(service.markAllAsRead).toHaveBeenCalledWith(
        mockCustomerPayload.id,
      );
      expect(response).toEqual({
        success: true,
        data: { updatedCount: 4 },
      });
    });

    it('debe retornar updatedCount: 0 si el cliente no tenía notificaciones pendientes', async () => {
      mockService.markAllAsRead.mockResolvedValue({ updatedCount: 0 });

      const response = await controller.markAllAsRead(mockCustomerPayload);

      expect(service.markAllAsRead).toHaveBeenCalledWith(
        mockCustomerPayload.id,
      );
      expect(response).toEqual({
        success: true,
        data: { updatedCount: 0 },
      });
    });
  });
});
