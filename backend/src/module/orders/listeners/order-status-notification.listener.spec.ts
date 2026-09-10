import { Logger } from '@nestjs/common';
import { OrderStatusNotificationListener } from './order-status-notification.listener';
import { OrderEventsPublisherService } from '../services/order-events-publisher.service';
import {
  CustomerNotificationsService,
  CreateOrderStatusNotificationParams,
} from '../../notifications/services/customer-notifications.service';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';
import { OrderStatus } from '../enums/order-status.enum';

describe('OrderStatusNotificationListener - BE-ADM-NOT-06', () => {
  let listener: OrderStatusNotificationListener;
  let mockPublisher: OrderEventsPublisherService;
  let mockCustomerNotificationsService: {
    createOrderStatusNotification: jest.Mock;
  };

  beforeEach(() => {
    mockPublisher = new OrderEventsPublisherService();
    mockCustomerNotificationsService = {
      createOrderStatusNotification: jest.fn().mockResolvedValue(null),
    };

    listener = new OrderStatusNotificationListener(
      mockPublisher,
      mockCustomerNotificationsService as unknown as CustomerNotificationsService,
    );
  });

  afterEach(() => {
    listener.onModuleDestroy();
  });

  it('debe estar definido el listener', () => {
    expect(listener).toBeDefined();
  });

  describe('handleOrderStatusChanged', () => {
    it('Caso Guest: no debe invocar createOrderStatusNotification si customerId es null', async () => {
      const guestEvent = new OrderStatusChangedEvent({
        orderId: 'ord-guest-1',
        orderNumber: 'GST12345',
        customerId: null,
        previousStatus: OrderStatus.NEW,
        newStatus: OrderStatus.PENDING,
      });

      const result = await listener.handleOrderStatusChanged(guestEvent);

      expect(result).toBe(false);
      expect(
        mockCustomerNotificationsService.createOrderStatusNotification,
      ).not.toHaveBeenCalled();
    });

    it('Caso Cliente Autenticado: debe invocar createOrderStatusNotification con el payload estructurado', async () => {
      const customerEvent = new OrderStatusChangedEvent({
        orderId: 'ord-cust-1',
        orderNumber: 'CST99999',
        customerId: 'customer-uuid-123',
        previousStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.ON_ROUTE,
      });

      const result = await listener.handleOrderStatusChanged(customerEvent);

      expect(result).toBe(true);
      expect(
        mockCustomerNotificationsService.createOrderStatusNotification,
      ).toHaveBeenCalledWith({
        customerId: 'customer-uuid-123',
        orderId: 'ord-cust-1',
        orderNumber: 'CST99999',
        newStatus: OrderStatus.ON_ROUTE,
        oldStatus: OrderStatus.PENDING,
      });
    });

    it('Manejo Aislado de Fallos: debe capturar errores y retornar false sin relanzar la excepción', async () => {
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      mockCustomerNotificationsService.createOrderStatusNotification.mockRejectedValue(
        new Error('SMTP_CONNECTION_TIMEOUT'),
      );

      const customerEvent = new OrderStatusChangedEvent({
        orderId: 'ord-cust-err',
        orderNumber: 'ERR12345',
        customerId: 'customer-uuid-456',
        previousStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.DELIVERED,
      });

      const result = await listener.handleOrderStatusChanged(customerEvent);

      expect(result).toBe(false);
      expect(
        mockCustomerNotificationsService.createOrderStatusNotification,
      ).toHaveBeenCalledWith({
        customerId: 'customer-uuid-456',
        orderId: 'ord-cust-err',
        orderNumber: 'ERR12345',
        newStatus: OrderStatus.DELIVERED,
        oldStatus: OrderStatus.PENDING,
      });

      loggerSpy.mockRestore();
    });
  });

  describe('Integración End-to-End con EventPublisher', () => {
    it('debe recibir el evento publicado e invocar al servicio de notificaciones automáticamente tras onModuleInit', (done) => {
      listener.onModuleInit();

      const customerEvent = new OrderStatusChangedEvent({
        eventId: 'evt-integration-1',
        orderId: 'ord-e2e-1',
        orderNumber: 'E2E77777',
        customerId: 'customer-uuid-777',
        previousStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.READY_FOR_PICKUP,
      });

      mockCustomerNotificationsService.createOrderStatusNotification.mockImplementation(
        (params: CreateOrderStatusNotificationParams) => {
          expect(params.orderNumber).toBe('E2E77777');
          expect(params.customerId).toBe('customer-uuid-777');
          done();
          return Promise.resolve(null);
        },
      );

      mockPublisher.publishOrderStatusChanged(customerEvent);
    });
  });
});
