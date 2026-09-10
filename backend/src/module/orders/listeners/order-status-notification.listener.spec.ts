import { OrderStatusNotificationListener } from './order-status-notification.listener';
import { OrderEventsPublisherService } from '../services/order-events-publisher.service';
import { CustomerNotificationsService } from '../../customers/services/customer-notifications.service';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';
import { OrderStatus } from '../enums/order-status.enum';

describe('OrderStatusNotificationListener - BE-ADM-NOT-06', () => {
  let listener: OrderStatusNotificationListener;
  let mockPublisher: any;
  let mockCustomerNotificationsService: any;

  beforeEach(() => {
    mockPublisher = new OrderEventsPublisherService();
    mockCustomerNotificationsService = {
      createOrderStatusNotification: jest.fn().mockResolvedValue(true),
    };

    listener = new OrderStatusNotificationListener(
      mockPublisher,
      mockCustomerNotificationsService,
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

    it('Caso Cliente Autenticado: debe invocar createOrderStatusNotification con el evento de dominio', async () => {
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
      ).toHaveBeenCalledWith(customerEvent);
    });

    it('Manejo Aislado de Fallos: debe capturar errores y retornar false sin relanzar la excepción', async () => {
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
      ).toHaveBeenCalledWith(customerEvent);
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
        (evt: OrderStatusChangedEvent) => {
          expect(evt.orderNumber).toBe('E2E77777');
          expect(evt.customerId).toBe('customer-uuid-777');
          done();
          return Promise.resolve(true);
        },
      );

      mockPublisher.publishOrderStatusChanged(customerEvent);
    });
  });
});
