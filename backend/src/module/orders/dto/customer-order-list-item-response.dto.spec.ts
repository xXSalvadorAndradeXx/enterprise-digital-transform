import { plainToInstance } from 'class-transformer';
import {
  CustomerOrderListItemResponseDto,
  OrderItemSummaryDto,
} from './customer-order-list-item-response.dto';

describe('CustomerOrderListItemResponseDto & OrderItemSummaryDto', () => {
  it('debería mapear correctamente los campos del item usando el snapshot persistido y permitir imageUrl null', () => {
    const rawItem = {
      productId: null,
      commercialName: 'Producto Eliminado Histórico',
      imageUrl: null,
      quantity: 3,
      unitPrice: '15.50',
      subtotal: '46.50',
      extraFieldIgnored: 'ignored',
    };

    const itemDto = plainToInstance(OrderItemSummaryDto, rawItem, {
      excludeExtraneousValues: true,
    });

    expect(itemDto.productId).toBeNull();
    expect(itemDto.commercialName).toBe('Producto Eliminado Histórico');
    expect(itemDto.imageUrl).toBeNull();
    expect(itemDto.quantity).toBe(3);
    expect(itemDto.unitPrice).toBe('15.50');
    expect(itemDto.subtotal).toBe('46.50');
    expect((itemDto as any).extraFieldIgnored).toBeUndefined();
  });

  it('debería mapear la tarjeta completa con itemsCount y arreglo de items anidados', () => {
    const rawOrder = {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      orderNumber: 'A7K29P4Q',
      createdAt: new Date('2026-09-07T18:00:00.000Z'),
      status: 'PENDING',
      paymentMethod: 'CREDIT_CARD',
      deliveryType: 'HOME_DELIVERY',
      total: '95.00',
      itemsCount: 2,
      items: [
        {
          productId: 'prod-uuid-1',
          commercialName: 'Pintura Látex',
          imageUrl: 'https://cdn.empresa.com/img.jpg',
          quantity: 2,
          unitPrice: '47.50',
          subtotal: '95.00',
        },
      ],
      sensibleDbData: 'secret',
    };

    const orderDto = plainToInstance(
      CustomerOrderListItemResponseDto,
      rawOrder,
      {
        excludeExtraneousValues: true,
      },
    );

    expect(orderDto.id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(orderDto.orderNumber).toBe('A7K29P4Q');
    expect(orderDto.status).toBe('PENDING');
    expect(orderDto.paymentMethod).toBe('CREDIT_CARD');
    expect(orderDto.deliveryType).toBe('HOME_DELIVERY');
    expect(orderDto.total).toBe('95.00');
    expect(orderDto.itemsCount).toBe(2);
    expect(orderDto.items.length).toBe(1);
    expect(orderDto.items[0].commercialName).toBe('Pintura Látex');
    expect(orderDto.items[0].imageUrl).toBe('https://cdn.empresa.com/img.jpg');
    expect((orderDto as any).sensibleDbData).toBeUndefined();
  });

  it('debería soportar los campos isAvailable y canRepurchase para navegación y volver a comprar', () => {
    const rawAvailable = {
      productId: 'prod-uuid-1',
      isAvailable: true,
      canRepurchase: true,
      commercialName: 'Producto Activo',
      imageUrl: 'https://cdn.empresa.com/img.jpg',
      quantity: 1,
      unitPrice: '20.00',
      subtotal: '20.00',
    };

    const dtoAvailable = plainToInstance(OrderItemSummaryDto, rawAvailable, {
      excludeExtraneousValues: true,
    });
    expect(dtoAvailable.productId).toBe('prod-uuid-1');
    expect(dtoAvailable.isAvailable).toBe(true);
    expect(dtoAvailable.canRepurchase).toBe(true);

    const rawUnavailable = {
      productId: null,
      isAvailable: false,
      canRepurchase: false,
      commercialName: 'Producto Descontinuado',
      imageUrl: null,
      quantity: 1,
      unitPrice: '20.00',
      subtotal: '20.00',
    };

    const dtoUnavailable = plainToInstance(
      OrderItemSummaryDto,
      rawUnavailable,
      {
        excludeExtraneousValues: true,
      },
    );
    expect(dtoUnavailable.productId).toBeNull();
    expect(dtoUnavailable.isAvailable).toBe(false);
    expect(dtoUnavailable.canRepurchase).toBe(false);
  });
});
