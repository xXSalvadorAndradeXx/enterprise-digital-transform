import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerOrderDetailItemDto {
  @ApiProperty({
    description: 'ID del ítem de la orden',
    example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec1',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description:
      'ID actual del producto para navegación o recompra (null si fue eliminado del catálogo)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nullable: true,
  })
  @Expose()
  productId!: string | null;

  @ApiProperty({
    description: 'ID de la variante configurada para recompra (si aplica)',
    example: 'e5f6a1b2-c3d4-7890-abcd-ef1234567890',
    nullable: true,
  })
  @Expose()
  variantId?: string | null;

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
    description: 'Nombre comercial histórico persistido del producto',
    example: 'Pintura Látex Supremo 1 Galón',
  })
  @Expose()
  commercialName!: string;

  @ApiProperty({
    description:
      'Combinación de atributos de variante (color / talla / tamaño)',
    example: 'Blanco Hueso / Mate',
    nullable: true,
  })
  @Expose()
  variantTitle?: string | null;

  @ApiProperty({
    description: 'SKU histórico de la variante comprada',
    example: 'PIN-LAT-BLA-01',
    nullable: true,
  })
  @Expose()
  sku?: string | null;

  @ApiProperty({
    description:
      'URL de imagen del producto o null para fallback seguro en Frontend',
    example: 'https://cdn.empresa.com/productos/pintura-latex.jpg',
    nullable: true,
  })
  @Expose()
  imageUrl!: string | null;

  @ApiProperty({ description: 'Cantidad de unidades compradas', example: 2 })
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
    description:
      'Porcentaje o snapshot de descuento aplicado al momento de compra',
    example: '10.00',
    nullable: true,
  })
  @Expose()
  discountSnapshot?: string | null;

  @ApiProperty({
    description: 'Subtotal histórico del ítem (snapshot persistido)',
    example: '50.00',
  })
  @Expose()
  subtotal!: string;
}

export class CustomerOrderDetailDeliveryDto {
  @ApiProperty({
    description: 'Tipo de entrega: HOME_DELIVERY o STORE_PICKUP',
    example: 'HOME_DELIVERY',
  })
  @Expose()
  deliveryType!: string;

  @ApiProperty({
    description: 'Nombre histórico del destinatario',
    example: 'Carlos Gómez',
    nullable: true,
  })
  @Expose()
  recipientName?: string | null;

  @ApiProperty({
    description: 'Teléfono histórico del destinatario',
    example: '+50371234567',
    nullable: true,
  })
  @Expose()
  recipientPhone?: string | null;

  @ApiProperty({
    description: 'Departamento de entrega guardado en la orden',
    example: 'San Salvador',
    nullable: true,
  })
  @Expose()
  departmentName?: string | null;

  @ApiProperty({
    description: 'Distrito / Municipio guardado en la orden',
    example: 'San Salvador Centro',
    nullable: true,
  })
  @Expose()
  districtName?: string | null;

  @ApiProperty({
    description: 'Ciudad guardada en la orden',
    example: 'San Salvador',
    nullable: true,
  })
  @Expose()
  city?: string | null;

  @ApiProperty({
    description:
      'Dirección física exacta persistida al momento del pedido (inmutable, no se sobrescribe con cambios de perfil)',
    example: 'Colonia Escalón, Calle Principal #123, Pasaje 2',
    nullable: true,
  })
  @Expose()
  addressLine?: string | null;

  @ApiProperty({
    description: 'ID de la sucursal de retiro en tienda (si aplica)',
    example: 'b1c2d3e4-f5a6-7890-abcd-ef1234567890',
    nullable: true,
  })
  @Expose()
  branchId?: string | null;

  @ApiProperty({
    description: 'Nombre de la sucursal de retiro persistido',
    example: 'Sucursal San Salvador Central',
    nullable: true,
  })
  @Expose()
  branchName?: string | null;

  @ApiProperty({
    description: 'Dirección física de la sucursal de retiro',
    example: 'Av. Roosevelt #456',
    nullable: true,
  })
  @Expose()
  branchAddress?: string | null;

  @ApiProperty({
    description: 'Teléfono de contacto de la sucursal de retiro',
    example: '+50322223333',
    nullable: true,
  })
  @Expose()
  branchPhone?: string | null;

  @ApiProperty({
    description: 'Número de seguimiento de despacho',
    example: 'TRK-2026-987654',
    nullable: true,
  })
  @Expose()
  trackingNumber?: string | null;

  @ApiProperty({
    description: 'Fecha estimada de entrega acordada',
    example: '2026-09-10',
    nullable: true,
  })
  @Expose()
  estimatedDeliveryDate?: Date | null;

  @ApiProperty({
    description: 'Costo total de envío aplicado a la orden',
    example: '5.00',
  })
  @Expose()
  shippingTotal!: string;
}

export class CustomerOrderStatusMilestoneDto {
  @ApiProperty({
    description:
      'Estado público alcanzado en este hito (NEW, PENDING, ON_ROUTE, READY_FOR_PICKUP, DELIVERED, CANCELLED)',
    example: 'PENDING',
  })
  @Expose()
  status!: string;

  @ApiProperty({
    description: 'Fecha y hora en que se registró el hito',
    example: '2026-09-07T18:00:00.000Z',
  })
  @Expose()
  timestamp!: Date;
}

export class CustomerOrderDetailResponseDto {
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
    description: 'Estado actual estandarizado de la orden',
    example: 'PENDING',
  })
  @Expose()
  status!: string;

  @ApiProperty({
    description: 'Método de pago acordado',
    example: 'CREDIT_CARD',
  })
  @Expose()
  paymentMethod!: string;

  @ApiProperty({
    description: 'Tipo de entrega (HOME_DELIVERY o STORE_PICKUP)',
    example: 'HOME_DELIVERY',
  })
  @Expose()
  deliveryType!: string;

  @ApiProperty({
    description: 'Subtotal antes de descuentos y envíos',
    example: '100.00',
  })
  @Expose()
  subtotal!: string;

  @ApiProperty({
    description: 'Monto total de descuentos aplicados a la orden',
    example: '10.00',
  })
  @Expose()
  discountTotal!: string;

  @ApiProperty({
    description: 'Costo total de despacho / envío',
    example: '5.00',
  })
  @Expose()
  shippingTotal!: string;

  @ApiProperty({
    description: 'Monto total neto pagado por la orden',
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
    description: 'Snapshot inmutable de entrega a domicilio o retiro en tienda',
    type: CustomerOrderDetailDeliveryDto,
    nullable: true,
  })
  @Expose()
  @Type(() => CustomerOrderDetailDeliveryDto)
  delivery?: CustomerOrderDetailDeliveryDto | null;

  @ApiProperty({
    description:
      'Lista completa de productos adquiridos con sus snapshots persistidos',
    type: [CustomerOrderDetailItemDto],
  })
  @Expose()
  @Type(() => CustomerOrderDetailItemDto)
  items!: CustomerOrderDetailItemDto[];

  @ApiProperty({
    description:
      'Cronología de hitos públicos de la orden (sin notas internas ni identificadores de auditoría del ERP)',
    type: [CustomerOrderStatusMilestoneDto],
  })
  @Expose()
  @Type(() => CustomerOrderStatusMilestoneDto)
  timeline!: CustomerOrderStatusMilestoneDto[];
}
