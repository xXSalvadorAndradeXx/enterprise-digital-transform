import { getMetadataArgsStorage } from 'typeorm';
import { CustomerNotification } from './customer-notification.entity';
import { NotificationType } from '../enums/notification-type.enum';

describe('CustomerNotification Entity', () => {
  const mockCustomerId = 'cust-uuid-1234-5678-9012';
  const mockOrderId = 'ord-uuid-1111-2222-3333';
  const mockProductId = 'prod-uuid-4444-5555-6666';

  it('debería instanciar correctamente una notificación de tipo ORDER_STATUS_CHANGED con orderId y sin productId', () => {
    const notification = new CustomerNotification();
    notification.id = 'notif-1';
    notification.customerId = mockCustomerId;
    notification.orderId = mockOrderId;
    notification.productId = null;
    notification.type = NotificationType.ORDER_STATUS_CHANGED;
    notification.title = 'Tu pedido #A7K29P4Q ha cambiado de estado';
    notification.message = 'Tu pedido ahora se encuentra EN RUTA.';
    notification.metadata = {
      orderNumber: 'A7K29P4Q',
      oldStatus: 'PENDING',
      newStatus: 'ON_ROUTE',
    };
    notification.actionUrl = '/cuenta/pedidos/A7K29P4Q';
    notification.isRead = false;
    notification.readAt = null;
    notification.createdAt = new Date();
    notification.updatedAt = new Date();

    expect(notification.orderId).toBe(mockOrderId);
    expect(notification.productId).toBeNull();
    expect(notification.type).toBe(NotificationType.ORDER_STATUS_CHANGED);
    expect(notification.isRead).toBe(false);
    expect(notification.readAt).toBeNull();
    expect(notification.actionUrl).toBe('/cuenta/pedidos/A7K29P4Q');
    expect(notification.metadata?.orderNumber).toBe('A7K29P4Q');
  });

  it('debería instanciar correctamente una notificación de tipo FAVORITE_PRICE_DROPPED con productId y sin orderId', () => {
    const notification = new CustomerNotification();
    notification.id = 'notif-2';
    notification.customerId = mockCustomerId;
    notification.orderId = null;
    notification.productId = mockProductId;
    notification.type = NotificationType.FAVORITE_PRICE_DROPPED;
    notification.title = '¡Bajó de precio un favorito!';
    notification.message =
      'Taladro Percutor 1/2 Pulgada bajó de $85.00 a $70.00';
    notification.metadata = {
      productId: mockProductId,
      commercialName: 'Taladro Percutor 1/2 Pulgada',
      oldPrice: 85.0,
      newPrice: 70.0,
    };
    notification.actionUrl = `/productos/${mockProductId}`;
    notification.isRead = false;
    notification.readAt = null;
    notification.createdAt = new Date();
    notification.updatedAt = new Date();

    expect(notification.productId).toBe(mockProductId);
    expect(notification.orderId).toBeNull();
    expect(notification.type).toBe(NotificationType.FAVORITE_PRICE_DROPPED);
    expect(notification.isRead).toBe(false);
    expect(notification.actionUrl).toBe(`/productos/${mockProductId}`);
    expect(notification.metadata?.newPrice).toBe(70.0);
  });

  it('debería instanciar correctamente una notificación de tipo SYSTEM_ANNOUNCEMENT con orderId y productId nulos', () => {
    const notification = new CustomerNotification();
    notification.id = 'notif-3';
    notification.customerId = mockCustomerId;
    notification.orderId = null;
    notification.productId = null;
    notification.type = NotificationType.SYSTEM_ANNOUNCEMENT;
    notification.title = 'Mantenimiento programado de la plataforma';
    notification.message =
      'El sistema estará en mantenimiento el domingo a las 02:00 AM.';
    notification.metadata = { maintenanceWindow: '2h' };
    notification.actionUrl = '/cuenta/notificaciones';
    notification.isRead = false;
    notification.readAt = null;
    notification.createdAt = new Date();
    notification.updatedAt = new Date();

    expect(notification.orderId).toBeNull();
    expect(notification.productId).toBeNull();
    expect(notification.type).toBe(NotificationType.SYSTEM_ANNOUNCEMENT);
  });

  it('debería permitir marcar como leída actualizando isRead y readAt', () => {
    const notification = new CustomerNotification();
    notification.isRead = false;
    notification.readAt = null;

    const readTimestamp = new Date();
    notification.isRead = true;
    notification.readAt = readTimestamp;

    expect(notification.isRead).toBe(true);
    expect(notification.readAt).toEqual(readTimestamp);
  });

  it('no debe requerir almacenar datos sensibles de pago ni credenciales en metadata', () => {
    const notification = new CustomerNotification();
    notification.metadata = {
      orderNumber: 'A7K29P4Q',
      status: 'DELIVERED',
    };

    expect((notification.metadata as any).creditCard).toBeUndefined();
    expect((notification.metadata as any).cvv).toBeUndefined();
    expect((notification.metadata as any).passwordHash).toBeUndefined();
  });

  it('debe tener configurados los índices compuestos y de filtrado en los metadatos de TypeORM', () => {
    const indices = getMetadataArgsStorage().indices.filter(
      (idx) => idx.target === CustomerNotification,
    );

    const indexNames = indices.map((idx) => idx.name);

    // Verificamos presencia de los índices requeridos para listado y filtros
    expect(indexNames).toContain('IDX_customer_notifications_customer_created');
    expect(indexNames).toContain(
      'IDX_customer_notifications_customer_type_created',
    );
    expect(indexNames).toContain('IDX_customer_notifications_customer_is_read');
    expect(indexNames).toContain('IDX_customer_notifications_order_id');
    expect(indexNames).toContain('IDX_customer_notifications_product_id');

    // Validamos las columnas indexadas del índice de pestañas
    const tabIndex = indices.find(
      (idx) => idx.name === 'IDX_customer_notifications_customer_type_created',
    );
    expect(tabIndex).toBeDefined();
    expect(tabIndex?.columns).toEqual(['customerId', 'type', 'createdAt']);

    // Validamos las columnas del índice de estado de lectura
    const readIndex = indices.find(
      (idx) => idx.name === 'IDX_customer_notifications_customer_is_read',
    );
    expect(readIndex).toBeDefined();
    expect(readIndex?.columns).toEqual(['customerId', 'isRead']);
  });
});
