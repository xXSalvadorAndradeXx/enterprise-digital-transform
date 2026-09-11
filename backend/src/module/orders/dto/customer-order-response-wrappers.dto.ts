import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CustomerOrderListItemResponseDto } from './customer-order-list-item-response.dto';
import { CustomerOrderDetailResponseDto } from './customer-order-detail-response.dto';

export class CustomerOrdersPaginationMetaDto {
  @ApiProperty({
    description: 'Total de órdenes históricas encontradas',
    example: 2,
  })
  total!: number;

  @ApiProperty({ description: 'Página actual consultada (>= 1)', example: 1 })
  page!: number;

  @ApiProperty({
    description: 'Cantidad máxima de órdenes por página (1 a 100)',
    example: 10,
  })
  limit!: number;

  @ApiProperty({ description: 'Total de páginas calculadas', example: 1 })
  totalPages!: number;

  @ApiProperty({
    description: 'Indica si existe una página siguiente',
    example: false,
  })
  hasNextPage!: boolean;

  @ApiProperty({
    description: 'Indica si existe una página previa',
    example: false,
  })
  hasPreviousPage!: boolean;
}

export class CustomerOrdersDataDto {
  @ApiProperty({
    description:
      'Arreglo de órdenes del cliente con resumen de artículos y disponibilidad para recompra',
    type: [CustomerOrderListItemResponseDto],
    example: [
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        orderNumber: 'A7K29P4Q',
        createdAt: '2026-09-07T18:00:00.000Z',
        status: 'PENDING',
        paymentMethod: 'CREDIT_CARD',
        deliveryType: 'HOME_DELIVERY',
        total: '95.00',
        itemsCount: 3,
        items: [
          {
            productId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            isAvailable: true,
            canRepurchase: true,
            commercialName: 'Pintura Látex Supremo 1 Galón',
            imageUrl: 'https://cdn.empresa.com/productos/pintura-latex.jpg',
            quantity: 2,
            unitPrice: '25.00',
            subtotal: '50.00',
          },
          {
            productId: null,
            isAvailable: false,
            canRepurchase: false,
            commercialName: 'Brocha Cerda Natural 2 Pulgadas (Descatalogado)',
            imageUrl: null,
            quantity: 1,
            unitPrice: '45.00',
            subtotal: '45.00',
          },
        ],
      },
      {
        id: 'e3a07284-b112-49cd-95d6-7c3d4754ceb8',
        orderNumber: 'C9M31R6S',
        createdAt: '2026-08-15T14:30:00.000Z',
        status: 'DELIVERED',
        paymentMethod: 'CREDIT_CARD',
        deliveryType: 'STORE_PICKUP',
        total: '85.00',
        itemsCount: 1,
        items: [
          {
            productId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            isAvailable: true,
            canRepurchase: true,
            commercialName: 'Taladro Percutor 1/2 Pulgada 110V',
            imageUrl: 'https://cdn.empresa.com/productos/taladro.jpg',
            quantity: 1,
            unitPrice: '85.00',
            subtotal: '85.00',
          },
        ],
      },
    ],
  })
  @Type(() => CustomerOrderListItemResponseDto)
  items!: CustomerOrderListItemResponseDto[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    type: CustomerOrdersPaginationMetaDto,
  })
  @Type(() => CustomerOrdersPaginationMetaDto)
  meta!: CustomerOrdersPaginationMetaDto;
}

export class CustomerOrdersPaginatedResponseDto {
  @ApiProperty({
    description: 'Indica si la petición fue procesada con éxito',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description:
      'Cuerpo de la respuesta con listado de compras y metadata de paginación',
    type: CustomerOrdersDataDto,
  })
  @Type(() => CustomerOrdersDataDto)
  data!: CustomerOrdersDataDto;
}

export class CustomerOrderDetailWrappedResponseDto {
  @ApiProperty({
    description: 'Indica si la petición fue procesada con éxito',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description:
      'Detalle histórico completo de la orden con snapshots inmutables de entrega, items y cronología',
    type: CustomerOrderDetailResponseDto,
  })
  @Type(() => CustomerOrderDetailResponseDto)
  data!: CustomerOrderDetailResponseDto;
}

export class CustomerOrderErrorResponseDto {
  @ApiProperty({ description: 'Código HTTP de estado', example: 400 })
  statusCode!: number;

  @ApiProperty({
    description: 'Código semántico de error de la aplicación',
    example: 'INVALID_ORDER_NUMBER',
  })
  code!: string;

  @ApiProperty({
    description: 'Mensaje legible o lista de mensajes de error de validación',
    example:
      'El número de orden provisto es inválido o no cumple el formato esperado',
  })
  message!: string | string[];

  @ApiProperty({
    description: 'Descripción de la categoría de error HTTP',
    example: 'Bad Request',
  })
  error!: string;
}
