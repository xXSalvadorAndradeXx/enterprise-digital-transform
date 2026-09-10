import { OrderStatusMessageMapper } from './order-status-message.mapper';
import { OrderStatus } from '../enums/order-status.enum';

describe('OrderStatusMessageMapper - BE-ADM-NOT-07', () => {
  const ORDER_NUMBER = 'A7K29P4Q';
  const EXPECTED_TITLE = 'Actualización de tu pedido';

  it('debe mapear el estado OrderStatus.NEW correctamente', () => {
    const result = OrderStatusMessageMapper.mapStatusToNotification(
      OrderStatus.NEW,
      ORDER_NUMBER,
    );

    expect(result.title).toBe(EXPECTED_TITLE);
    expect(result.message).toContain(ORDER_NUMBER);
    expect(result.message).toBe(
      `Tu pedido #${ORDER_NUMBER} ha sido registrado correctamente.`,
    );
  });

  it('debe mapear el estado OrderStatus.PENDING correctamente', () => {
    const result = OrderStatusMessageMapper.mapStatusToNotification(
      OrderStatus.PENDING,
      ORDER_NUMBER,
    );

    expect(result.title).toBe(EXPECTED_TITLE);
    expect(result.message).toContain(ORDER_NUMBER);
    expect(result.message).toBe(
      `Tu pedido #${ORDER_NUMBER} está siendo procesado y preparado.`,
    );
  });

  it('debe mapear el estado OrderStatus.ON_ROUTE correctamente', () => {
    const result = OrderStatusMessageMapper.mapStatusToNotification(
      OrderStatus.ON_ROUTE,
      ORDER_NUMBER,
    );

    expect(result.title).toBe(EXPECTED_TITLE);
    expect(result.message).toContain(ORDER_NUMBER);
    expect(result.message).toBe(
      `Tu pedido #${ORDER_NUMBER} está en camino a tu dirección de entrega.`,
    );
  });

  it('debe mapear el estado OrderStatus.READY_FOR_PICKUP correctamente', () => {
    const result = OrderStatusMessageMapper.mapStatusToNotification(
      OrderStatus.READY_FOR_PICKUP,
      ORDER_NUMBER,
    );

    expect(result.title).toBe(EXPECTED_TITLE);
    expect(result.message).toContain(ORDER_NUMBER);
    expect(result.message).toBe(
      `Tu pedido #${ORDER_NUMBER} está listo para ser retirado en sucursal.`,
    );
  });

  it('debe mapear el estado OrderStatus.DELIVERED correctamente', () => {
    const result = OrderStatusMessageMapper.mapStatusToNotification(
      OrderStatus.DELIVERED,
      ORDER_NUMBER,
    );

    expect(result.title).toBe(EXPECTED_TITLE);
    expect(result.message).toContain(ORDER_NUMBER);
    expect(result.message).toBe(
      `Tu pedido #${ORDER_NUMBER} ha sido entregado exitosamente. ¡Gracias por tu compra!`,
    );
  });

  it('debe mapear el estado OrderStatus.CANCELLED correctamente', () => {
    const result = OrderStatusMessageMapper.mapStatusToNotification(
      OrderStatus.CANCELLED,
      ORDER_NUMBER,
    );

    expect(result.title).toBe(EXPECTED_TITLE);
    expect(result.message).toContain(ORDER_NUMBER);
    expect(result.message).toBe(
      `Tu pedido #${ORDER_NUMBER} ha sido cancelado.`,
    );
  });

  it('debe usar un fallback controlado para un estado futuro o desconocido', () => {
    const futureStatus = 'FUTURE_STATUS_TEST' as any;
    const result = OrderStatusMessageMapper.mapStatusToNotification(
      futureStatus,
      ORDER_NUMBER,
    );

    expect(result.title).toBe(EXPECTED_TITLE);
    expect(result.message).toContain(ORDER_NUMBER);
    expect(result.message).toBe(
      `El estado de tu pedido #${ORDER_NUMBER} ha sido actualizado a FUTURE_STATUS_TEST.`,
    );
  });
});
