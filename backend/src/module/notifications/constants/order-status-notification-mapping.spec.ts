import { OrderStatus } from '../../orders/enums/order-status.enum';
import {
  getOrderStatusNotificationText,
  ORDER_STATUS_NOTIFICATION_TEMPLATES,
} from './order-status-notification-mapping';

describe('OrderStatusNotificationMapping', () => {
  const mockOrderNumber = 'A7K29P4Q';

  it('debe tener definida una plantilla para cada valor de OrderStatus', () => {
    const statuses = Object.values(OrderStatus);
    statuses.forEach((status) => {
      expect(ORDER_STATUS_NOTIFICATION_TEMPLATES[status]).toBeDefined();
      const result =
        ORDER_STATUS_NOTIFICATION_TEMPLATES[status](mockOrderNumber);
      expect(result.title).toContain(mockOrderNumber);
      expect(result.message).toContain(mockOrderNumber);
    });
  });

  it('debe mapear NEW correctamente', () => {
    const result = getOrderStatusNotificationText(
      mockOrderNumber,
      OrderStatus.NEW,
    );
    expect(result.title).toBe('Pedido registrado #A7K29P4Q');
    expect(result.message).toBe(
      'Hemos recibido tu pedido #A7K29P4Q. Estamos procesando tu compra.',
    );
  });

  it('debe mapear PENDING correctamente', () => {
    const result = getOrderStatusNotificationText(
      mockOrderNumber,
      OrderStatus.PENDING,
    );
    expect(result.title).toBe('Pedido pendiente #A7K29P4Q');
    expect(result.message).toBe(
      'Tu pedido #A7K29P4Q está pendiente de confirmación o pago.',
    );
  });

  it('debe mapear ON_ROUTE correctamente', () => {
    const result = getOrderStatusNotificationText(
      mockOrderNumber,
      OrderStatus.ON_ROUTE,
    );
    expect(result.title).toBe('¡Tu pedido #A7K29P4Q está en camino!');
    expect(result.message).toBe(
      'Tu pedido #A7K29P4Q ha salido hacia tu dirección de entrega.',
    );
  });

  it('debe mapear READY_FOR_PICKUP correctamente', () => {
    const result = getOrderStatusNotificationText(
      mockOrderNumber,
      OrderStatus.READY_FOR_PICKUP,
    );
    expect(result.title).toBe('Pedido listo para retiro #A7K29P4Q');
    expect(result.message).toBe(
      'Tu pedido #A7K29P4Q ya está disponible para retirar en sucursal.',
    );
  });

  it('debe mapear DELIVERED correctamente', () => {
    const result = getOrderStatusNotificationText(
      mockOrderNumber,
      OrderStatus.DELIVERED,
    );
    expect(result.title).toBe('Pedido entregado #A7K29P4Q');
    expect(result.message).toBe(
      'Tu pedido #A7K29P4Q ha sido entregado exitosamente. ¡Gracias por tu compra!',
    );
  });

  it('debe mapear CANCELLED correctamente', () => {
    const result = getOrderStatusNotificationText(
      mockOrderNumber,
      OrderStatus.CANCELLED,
    );
    expect(result.title).toBe('Pedido cancelado #A7K29P4Q');
    expect(result.message).toBe(
      'Tu pedido #A7K29P4Q ha sido cancelado. Si tienes dudas, contáctanos.',
    );
  });

  it('debe utilizar fallback seguro ante un estado no mapeado o desconocido', () => {
    const result = getOrderStatusNotificationText(
      mockOrderNumber,
      'CUSTOM_STATE',
    );
    expect(result.title).toBe('Actualización de pedido #A7K29P4Q');
    expect(result.message).toBe(
      'Tu pedido #A7K29P4Q ahora se encuentra en estado CUSTOM_STATE.',
    );
  });
});
