import { plainToInstance } from 'class-transformer';
import {
  CustomerOrderDetailResponseDto,
  CustomerOrderDetailItemDto,
  CustomerOrderDetailDeliveryDto,
  CustomerOrderStatusMilestoneDto,
} from './customer-order-detail-response.dto';

describe('CustomerOrderDetailResponseDto', () => {
  it('debería mapear correctamente los ítems con snapshots históricos e imágenes', () => {
    const rawItem = {
      id: 'item-uuid-1',
      productId: 'prod-uuid-1',
      variantId: 'variant-uuid-1',
      commercialName: 'Taladro Percutor 1/2 Pulgada',
      variantTitle: '110V / Industrial',
      sku: 'TAL-PER-110',
      imageUrl: 'https://cdn.empresa.com/taladro.jpg',
      quantity: 1,
      unitPrice: '85.00',
      discountSnapshot: '5.00',
      subtotal: '80.00',
      internalCost: '40.00', // Campo confidencial que debe ser ignorado
    };

    const itemDto = plainToInstance(CustomerOrderDetailItemDto, rawItem, {
      excludeExtraneousValues: true,
    });

    expect(itemDto.id).toBe('item-uuid-1');
    expect(itemDto.productId).toBe('prod-uuid-1');
    expect(itemDto.variantId).toBe('variant-uuid-1');
    expect(itemDto.commercialName).toBe('Taladro Percutor 1/2 Pulgada');
    expect(itemDto.variantTitle).toBe('110V / Industrial');
    expect(itemDto.sku).toBe('TAL-PER-110');
    expect(itemDto.imageUrl).toBe('https://cdn.empresa.com/taladro.jpg');
    expect(itemDto.quantity).toBe(1);
    expect(itemDto.unitPrice).toBe('85.00');
    expect(itemDto.discountSnapshot).toBe('5.00');
    expect(itemDto.subtotal).toBe('80.00');
    expect((itemDto as any).internalCost).toBeUndefined();
  });

  it('debería soportar productos eliminados del catálogo con productId null', () => {
    const rawItem = {
      id: 'item-uuid-2',
      productId: null,
      variantId: null,
      commercialName: 'Disco de Corte Descatalogado',
      imageUrl: null,
      quantity: 5,
      unitPrice: '2.00',
      subtotal: '10.00',
    };

    const itemDto = plainToInstance(CustomerOrderDetailItemDto, rawItem, {
      excludeExtraneousValues: true,
    });

    expect(itemDto.productId).toBeNull();
    expect(itemDto.imageUrl).toBeNull();
    expect(itemDto.commercialName).toBe('Disco de Corte Descatalogado');
  });

  it('debería soportar los campos isAvailable y canRepurchase en el detalle del ítem', () => {
    const rawAvailable = {
      id: 'item-uuid-1',
      productId: 'prod-uuid-1',
      isAvailable: true,
      canRepurchase: true,
      commercialName: 'Producto Activo',
      quantity: 1,
      unitPrice: '10.00',
      subtotal: '10.00',
    };
    const dtoAvailable = plainToInstance(
      CustomerOrderDetailItemDto,
      rawAvailable,
      {
        excludeExtraneousValues: true,
      },
    );
    expect(dtoAvailable.isAvailable).toBe(true);
    expect(dtoAvailable.canRepurchase).toBe(true);

    const rawUnavailable = {
      id: 'item-uuid-2',
      productId: null,
      isAvailable: false,
      canRepurchase: false,
      commercialName: 'Producto Inactivo',
      quantity: 1,
      unitPrice: '10.00',
      subtotal: '10.00',
    };
    const dtoUnavailable = plainToInstance(
      CustomerOrderDetailItemDto,
      rawUnavailable,
      {
        excludeExtraneousValues: true,
      },
    );
    expect(dtoUnavailable.isAvailable).toBe(false);
    expect(dtoUnavailable.canRepurchase).toBe(false);
  });

  it('debería mapear el snapshot inmutable de entrega excluyendo direcciones mutables actuales', () => {
    const rawDelivery = {
      deliveryType: 'HOME_DELIVERY',
      recipientName: 'Juan Pérez',
      recipientPhone: '+50370001122',
      departmentName: 'La Libertad',
      districtName: 'Santa Tecla',
      city: 'Santa Tecla',
      addressLine: 'Residencial San Antonio, Senda 3, Casa 12',
      shippingTotal: '4.50',
      trackingNumber: 'TRK-987654',
      internalDriverNotes: 'No tocar el portón', // Confidencial
    };

    const deliveryDto = plainToInstance(
      CustomerOrderDetailDeliveryDto,
      rawDelivery,
      {
        excludeExtraneousValues: true,
      },
    );

    expect(deliveryDto.deliveryType).toBe('HOME_DELIVERY');
    expect(deliveryDto.recipientName).toBe('Juan Pérez');
    expect(deliveryDto.addressLine).toBe(
      'Residencial San Antonio, Senda 3, Casa 12',
    );
    expect(deliveryDto.shippingTotal).toBe('4.50');
    expect((deliveryDto as any).internalDriverNotes).toBeUndefined();
  });

  it('debería mapear la cronología pública excluyendo changedById y notas confidenciales', () => {
    const rawMilestone = {
      status: 'ON_ROUTE',
      timestamp: new Date('2026-09-08T10:00:00.000Z'),
      changedById: 'admin-user-uuid', // Confidencial
      notes: 'Nota interna confidencial del supervisor', // Confidencial
    };

    const milestoneDto = plainToInstance(
      CustomerOrderStatusMilestoneDto,
      rawMilestone,
      {
        excludeExtraneousValues: true,
      },
    );

    expect(milestoneDto.status).toBe('ON_ROUTE');
    expect(milestoneDto.timestamp).toEqual(
      new Date('2026-09-08T10:00:00.000Z'),
    );
    expect((milestoneDto as any).changedById).toBeUndefined();
    expect((milestoneDto as any).notes).toBeUndefined();
  });

  it('debería serializar el detalle completo con exclusión de campos de gateway y pagos confidenciales', () => {
    const rawOrderDetail = {
      id: 'ord-uuid-1',
      orderNumber: 'A7K29P4Q',
      createdAt: new Date('2026-09-07T18:00:00.000Z'),
      status: 'DELIVERED',
      paymentMethod: 'CREDIT_CARD',
      deliveryType: 'HOME_DELIVERY',
      subtotal: '100.00',
      discountTotal: '10.00',
      shippingTotal: '5.00',
      total: '95.00',
      itemsCount: 2,
      guestOrderAccessTokenHash: 'super_secret_hash', // Debe ser excluido
      cardToken: 'tok_visa_123', // Debe ser excluido
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          commercialName: 'Pintura',
          quantity: 2,
          unitPrice: '50.00',
          subtotal: '100.00',
        },
      ],
      delivery: {
        deliveryType: 'HOME_DELIVERY',
        shippingTotal: '5.00',
        addressLine: 'Calle 1',
      },
      timeline: [
        {
          status: 'DELIVERED',
          timestamp: new Date('2026-09-07T20:00:00.000Z'),
        },
      ],
    };

    const dto = plainToInstance(
      CustomerOrderDetailResponseDto,
      rawOrderDetail,
      {
        excludeExtraneousValues: true,
      },
    );

    expect(dto.orderNumber).toBe('A7K29P4Q');
    expect(dto.itemsCount).toBe(2);
    expect(dto.items.length).toBe(1);
    expect(dto.items[0].commercialName).toBe('Pintura');
    expect(dto.delivery?.addressLine).toBe('Calle 1');
    expect(dto.timeline.length).toBe(1);
    expect((dto as any).guestOrderAccessTokenHash).toBeUndefined();
    expect((dto as any).cardToken).toBeUndefined();
  });
});
