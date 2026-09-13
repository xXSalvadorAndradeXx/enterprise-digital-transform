import { plainToInstance } from 'class-transformer';
import {
  CustomerOrdersPaginatedResponseDto,
  CustomerOrderDetailWrappedResponseDto,
  CustomerOrderErrorResponseDto,
} from './customer-order-response-wrappers.dto';

describe('CustomerOrderResponseWrappersDto', () => {
  it('debería serializar correctamente la respuesta paginada con items y metadata', () => {
    const rawData = {
      success: true,
      data: {
        items: [
          {
            id: 'ord-1',
            orderNumber: 'A7K29P4Q',
            createdAt: new Date('2026-09-07T18:00:00.000Z'),
            status: 'PENDING',
            paymentMethod: 'CREDIT_CARD',
            deliveryType: 'HOME_DELIVERY',
            total: '95.00',
            itemsCount: 3,
            items: [
              {
                productId: 'p-1',
                isAvailable: true,
                canRepurchase: true,
                commercialName: 'Pintura Látex',
                imageUrl: 'https://cdn.example.com/p1.jpg',
                quantity: 2,
                unitPrice: '25.00',
                subtotal: '50.00',
              },
              {
                productId: null,
                isAvailable: false,
                canRepurchase: false,
                commercialName: 'Brocha Descatalogada',
                imageUrl: null,
                quantity: 1,
                unitPrice: '45.00',
                subtotal: '45.00',
              },
            ],
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    const instance = plainToInstance(
      CustomerOrdersPaginatedResponseDto,
      rawData,
    );
    expect(instance.success).toBe(true);
    expect(instance.data.items.length).toBe(1);
    expect(instance.data.items[0].items.length).toBe(2);
    expect(instance.data.items[0].items[0].isAvailable).toBe(true);
    expect(instance.data.items[0].items[1].productId).toBeNull();
    expect(instance.data.items[0].items[1].isAvailable).toBe(false);
    expect(instance.data.meta.total).toBe(1);
  });

  it('debería serializar la respuesta de detalle envuelta', () => {
    const rawDetail = {
      success: true,
      data: {
        id: 'ord-1',
        orderNumber: 'A7K29P4Q',
        createdAt: new Date('2026-09-07T18:00:00.000Z'),
        status: 'PENDING',
        paymentMethod: 'CREDIT_CARD',
        deliveryType: 'HOME_DELIVERY',
        subtotal: '95.00',
        discountTotal: '0.00',
        shippingTotal: '5.00',
        total: '100.00',
        itemsCount: 1,
        items: [],
        timeline: [],
      },
    };

    const instance = plainToInstance(
      CustomerOrderDetailWrappedResponseDto,
      rawDetail,
    );
    expect(instance.success).toBe(true);
    expect(instance.data.orderNumber).toBe('A7K29P4Q');
  });

  it('debería serializar la estructura estándar de error', () => {
    const rawError = {
      statusCode: 400,
      code: 'INVALID_ORDER_NUMBER',
      message:
        'El número de orden provisto es inválido o no cumple el formato esperado',
      error: 'Bad Request',
    };

    const instance = plainToInstance(CustomerOrderErrorResponseDto, rawError);
    expect(instance.statusCode).toBe(400);
    expect(instance.code).toBe('INVALID_ORDER_NUMBER');
  });
});
