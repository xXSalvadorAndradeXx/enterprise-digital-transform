import { OrderEventsPublisherService } from './order-events-publisher.service';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';
import { OrderStatus } from '../enums/order-status.enum';

describe('OrderEventsPublisherService - BE-ADM-NOT-05', () => {
  let service: OrderEventsPublisherService;

  beforeEach(() => {
    service = new OrderEventsPublisherService();
  });

  it('debe estar definido el publisher', () => {
    expect(service).toBeDefined();
  });

  it('debe publicar el evento una sola vez y evitar emisiones duplicadas con el mismo eventId', () => {
    const event = new OrderStatusChangedEvent({
      eventId: 'evt-unique-123',
      orderId: 'ord-uuid-1',
      orderNumber: 'A7K29P4Q',
      customerId: 'cust-uuid-1',
      previousStatus: OrderStatus.PENDING,
      newStatus: OrderStatus.ON_ROUTE,
    });

    let receivedEventsCount = 0;
    service.onOrderStatusChanged$.subscribe(() => {
      receivedEventsCount++;
    });

    // Primera publicación -> Éxito (true)
    const firstCall = service.publishOrderStatusChanged(event);
    expect(firstCall).toBe(true);
    expect(receivedEventsCount).toBe(1);

    // Segunda publicación con el mismo eventId (Reintento) -> Ignorado (false)
    const secondCall = service.publishOrderStatusChanged(event);
    expect(secondCall).toBe(false);
    expect(receivedEventsCount).toBe(1);
  });

  it('debe admitir customerId nullable para compras de invitados (Guest)', (done) => {
    const guestEvent = new OrderStatusChangedEvent({
      orderId: 'ord-uuid-guest',
      orderNumber: 'GST98765',
      customerId: null,
      previousStatus: OrderStatus.NEW,
      newStatus: OrderStatus.PENDING,
    });

    service.onOrderStatusChanged$.subscribe((emittedEvent) => {
      expect(emittedEvent.customerId).toBeNull();
      expect(emittedEvent.orderNumber).toBe('GST98765');
      // Garantizar que no se inyectan propiedades arbitrarias de notificaciones (title / message)
      expect((emittedEvent as any).title).toBeUndefined();
      expect((emittedEvent as any).message).toBeUndefined();
      done();
    });

    service.publishOrderStatusChanged(guestEvent);
  });
});
