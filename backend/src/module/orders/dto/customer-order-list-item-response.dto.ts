import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemSummaryDto {
  @ApiProperty({
    description:
      'ID único del producto (UUID v4) o null si el producto fue eliminado',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nullable: true,
  })
  @Expose()
  productId!: string | null;

  @ApiProperty({
    description:
      'Indica si el producto está actualmente activo y publicado en el catálogo para recompra',
    example: true,
  })
  @Expose()
  isAvailable!: boolean;

  @ApiProperty({
    description:
      'Bandera de habilitación para volver a comprar (alias de isAvailable)',
    example: true,
    required: false,
  })
  @Expose()
  canRepurchase?: boolean;

  @ApiProperty({
    description: 'Nombre comercial histórico del producto',
    example: 'Pintura Látex Supremo 1 Galón',
  })
  @Expose()
  commercialName!: string;

  @ApiProperty({
    description:
      'URL de la imagen del producto o null para fallback seguro en Frontend',
    example: 'https://cdn.empresa.com/productos/pintura-latex.jpg',
    nullable: true,
  })
  @Expose()
  imageUrl!: string | null;

  @ApiProperty({
    description: 'Cantidad de unidades compradas',
    example: 2,
  })
  @Expose()
  quantity!: number;

  @ApiProperty({
    description:
      'Precio unitario histórico pagado (snapshot persistido, no catálogo actual)',
    example: '25.00',
  })
  @Expose()
  unitPrice!: string;

  @ApiProperty({
    description: 'Subtotal histórico del ítem (snapshot persistido)',
    example: '50.00',
  })
  @Expose()
  subtotal!: string;
}

export class CustomerOrderListItemResponseDto {
  @ApiProperty({
    description: 'ID único de la orden (UUID v4)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Número público legible de la orden',
    example: 'A7K29P4Q',
  })
  @Expose()
  orderNumber!: string;

  @ApiProperty({
    description: 'Fecha y hora de creación de la orden',
    example: '2026-09-07T18:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description:
      'Estado actual estandarizado de la orden (NEW, PENDING, ON_ROUTE, READY_FOR_PICKUP, DELIVERED, CANCELLED)',
    example: 'PENDING',
  })
  @Expose()
  status!: string;

  @ApiProperty({
    description: 'Método de pago utilizado para la orden',
    example: 'CREDIT_CARD',
  })
  @Expose()
  paymentMethod!: string;

  @ApiProperty({
    description: 'Tipo de entrega acordado (HOME_DELIVERY o STORE_PICKUP)',
    example: 'HOME_DELIVERY',
  })
  @Expose()
  deliveryType!: string;

  @ApiProperty({
    description: 'Monto total final formateado a 2 decimales',
    example: '95.00',
  })
  @Expose()
  total!: string;

  @ApiProperty({
    description: 'Cantidad total de artículos/unidades en la orden',
    example: 3,
  })
  @Expose()
  itemsCount!: number;

  @ApiProperty({
    description:
      'Resumen compacto de artículos para renderizado de tarjetas en Frontend',
    type: [OrderItemSummaryDto],
  })
  @Expose()
  @Type(() => OrderItemSummaryDto)
  items!: OrderItemSummaryDto[];
}
