import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

import { Order } from '../entities/order.entity';
import { Customer } from '../../customers/entities/customer.entity';
import {
  CustomerOrderListItemResponseDto,
  OrderItemSummaryDto,
} from '../dto/customer-order-list-item-response.dto';
import {
  CustomerOrderDetailResponseDto,
  CustomerOrderDetailItemDto,
  CustomerOrderDetailDeliveryDto,
  CustomerOrderStatusMilestoneDto,
} from '../dto/customer-order-detail-response.dto';
import { CustomerOrdersQueryDto } from '../dto/customer-orders-query.dto';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { DeliveryMethod } from '../enums/delivery-method.enum';

@Injectable()
export class CustomerOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  /**
   * Mapea un estado histórico o interno a la nomenclatura estandarizada.
   */
  private mapHistoricalStatus(status: string): string {
    const upperStatus = (status || '').toUpperCase();
    switch (upperStatus) {
      case 'NEW':
        return 'NEW';
      case 'PENDING':
      case 'PROCESSING':
        return 'PENDING';
      case 'ON_ROUTE':
      case 'SHIPPED':
        return 'ON_ROUTE';
      case 'READY_FOR_PICKUP':
        return 'READY_FOR_PICKUP';
      case 'DELIVERED':
      case 'COMPLETED':
      case 'PICKED_UP':
        return 'DELIVERED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Obtiene la lista paginada de órdenes asociadas a un cliente específico,
   * con soporte para filtrado por estado, ordenamiento cronológico y resumen de artículos.
   * Excluye estrictamente órdenes guest y garantiza paginación sin duplicados vía TypeORM skip/take.
   */
  async findAllByCustomer(
    customerId: string,
    query?: CustomerOrdersQueryDto,
  ): Promise<{
    orders: CustomerOrderListItemResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const statusFilter = query?.status;
    const sortOrder = query?.sortOrder || 'DESC';

    // Validar existencia del cliente de forma óptima (SELECT 1 ... LIMIT 1)
    const customerExists = await this.customerRepository.exists({
      where: { id: customerId },
    });
    if (!customerExists) {
      throw new NotFoundException({
        code: 'CUSTOMER_NOT_FOUND',
        message: 'El cliente especificado no existe o fue eliminado',
      });
    }

    const skip = (page - 1) * limit;
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('order.delivery', 'delivery')
      .where(
        'order.customerId = :customerId AND order.customerId IS NOT NULL',
        { customerId },
      );

    if (statusFilter) {
      queryBuilder.andWhere('order.status = :statusFilter', { statusFilter });
    }

    queryBuilder
      .orderBy('order.createdAt', sortOrder)
      .addOrderBy('order.id', 'ASC')
      .addOrderBy('images.sortOrder', 'ASC')
      .skip(skip)
      .take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;

    const formattedOrders = orders.map((o) => {
      const itemsCount = o.items
        ? o.items.reduce((acc, item) => acc + (item.quantity || 0), 0)
        : 0;

      const itemsSummary: OrderItemSummaryDto[] = (o.items || []).map(
        (item) => {
          let imageUrl: string | null = null;
          if (item.product?.images && item.product.images.length > 0) {
            const sortedImages = [...item.product.images].sort(
              (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
            );
            imageUrl = sortedImages[0].imageUrl || null;
          }

          const isAvailable = Boolean(
            item.product &&
            item.product.isPublished === true &&
            item.product.status === ProductStatus.ACTIVE &&
            !item.product.deletedAt,
          );

          return {
            productId: item.product?.id || null,
            isAvailable,
            canRepurchase: isAvailable,
            commercialName: item.product?.commercialName || 'Producto',
            imageUrl,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice || 0).toFixed(2),
            subtotal: Number(item.subtotal || 0).toFixed(2),
          };
        },
      );

      const rawMapped = {
        id: o.id,
        orderNumber: o.orderNumber,
        status: this.mapHistoricalStatus(o.status),
        createdAt: o.createdAt,
        paymentMethod: 'CREDIT_CARD', // Default per checkout specification
        deliveryType:
          o.delivery?.deliveryType ||
          (o.deliveryMethod === DeliveryMethod.PICKUP
            ? 'STORE_PICKUP'
            : o.deliveryMethod) ||
          'HOME_DELIVERY',
        total: Number(o.totalAmount || 0).toFixed(2),
        itemsCount,
        items: itemsSummary,
      };
      return plainToInstance(CustomerOrderListItemResponseDto, rawMapped, {
        excludeExtraneousValues: true,
      });
    });

    return {
      orders: formattedOrders,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Alias de compatibilidad hacia findAllByCustomer
   */
  async findOrdersForCustomer(
    customerId: string,
    queryOrPage: number | CustomerOrdersQueryDto = 1,
    limitParam: number = 10,
  ) {
    if (typeof queryOrPage === 'object' && queryOrPage !== null) {
      return this.findAllByCustomer(customerId, queryOrPage);
    }
    const query = new CustomerOrdersQueryDto();
    query.page = queryOrPage;
    query.limit = limitParam;
    return this.findAllByCustomer(customerId, query);
  }

  /**
   * Obtiene los detalles completos de una orden para el cliente autenticado de forma segura.
   * Consulta orderNumber + customerId en la misma sentencia SQL para mitigar riesgos de
   * enumeración de pedidos (anti-IDOR) y retorna 404 ORDER_NOT_FOUND tanto si la orden
   * no existe como si pertenece a otro cliente.
   *
   * Admite inversión de parámetros (orderNumber, customerId) por flexibilidad de invocación.
   */
  async findOneByOrderNumber(
    customerIdOrOrderNumber: string,
    orderNumberOrCustomerId: string,
  ): Promise<CustomerOrderDetailResponseDto> {
    const isFirstParamOrderNumber =
      /^[A-Za-z0-9]{8}$/.test(customerIdOrOrderNumber) &&
      customerIdOrOrderNumber.length === 8 &&
      !customerIdOrOrderNumber.includes('-');

    const customerId = isFirstParamOrderNumber
      ? orderNumberOrCustomerId
      : customerIdOrOrderNumber;
    const rawOrderNumber = isFirstParamOrderNumber
      ? customerIdOrOrderNumber
      : orderNumberOrCustomerId;
    const normalizedOrderNumber = (rawOrderNumber || '').trim().toUpperCase();

    const order = await this.orderRepository.findOne({
      where: {
        orderNumber: normalizedOrderNumber,
        customerId,
      },
      relations: [
        'items',
        'items.product',
        'items.product.images',
        'delivery',
        'delivery.branch',
        'statusHistory',
      ],
    });

    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: `No se encontró la orden con número ${normalizedOrderNumber}`,
      });
    }

    const itemsCount = order.items
      ? order.items.reduce((acc, item) => acc + (item.quantity || 0), 0)
      : 0;

    const mappedItems: CustomerOrderDetailItemDto[] = (order.items || []).map(
      (item) => {
        let imageUrl: string | null = null;
        if (item.product?.images && item.product.images.length > 0) {
          const sortedImages = [...item.product.images].sort(
            (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
          );
          imageUrl = sortedImages[0].imageUrl || null;
        }

        const isAvailable = Boolean(
          item.product &&
          item.product.isPublished === true &&
          item.product.status === ProductStatus.ACTIVE &&
          !item.product.deletedAt,
        );

        return {
          id: item.id,
          productId: isAvailable && item.product ? item.product.id : null,
          variantId: null,
          isAvailable,
          canRepurchase: isAvailable,
          commercialName:
            item.product?.commercialName ||
            (item.sku ? `Producto (${item.sku})` : 'Producto no disponible'),
          variantTitle:
            [item.color, item.size].filter(Boolean).join(' / ') || null,
          sku: item.sku || null,
          imageUrl,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice || 0).toFixed(2),
          discountSnapshot:
            item.discountSnapshot != null
              ? String(item.discountSnapshot)
              : null,
          subtotal: Number(item.subtotal || 0).toFixed(2),
        };
      },
    );

    const mappedDelivery: CustomerOrderDetailDeliveryDto | null = order.delivery
      ? {
          deliveryType:
            order.delivery.deliveryType ||
            (order.deliveryMethod === DeliveryMethod.PICKUP
              ? 'STORE_PICKUP'
              : order.deliveryMethod) ||
            'HOME_DELIVERY',
          recipientName: order.customerName || null,
          recipientPhone: order.customerPhone || null,
          departmentName: order.delivery.departmentName || null,
          districtName: order.delivery.districtName || null,
          city: order.delivery.city || null,
          addressLine: order.delivery.addressLine || null,
          branchId: order.delivery.branchId || null,
          branchName:
            order.delivery.branchName || order.delivery.branch?.name || null,
          branchAddress:
            order.delivery.branchAddress ||
            order.delivery.branch?.address ||
            null,
          branchPhone:
            order.delivery.branchPhone || order.delivery.branch?.phone || null,
          trackingNumber: order.delivery.trackingNumber || null,
          estimatedDeliveryDate: order.delivery.estimatedDeliveryDate || null,
          shippingTotal: Number(
            order.delivery.shippingTotal || order.deliveryCost || 0,
          ).toFixed(2),
        }
      : null;

    const mappedTimeline: CustomerOrderStatusMilestoneDto[] = (
      order.statusHistory || []
    ).map((h) => ({
      status: this.mapHistoricalStatus(h.statusAfter),
      timestamp: h.changedAt,
    }));

    const rawMapped = {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: this.mapHistoricalStatus(order.status),
      paymentMethod: 'CREDIT_CARD', // Default per checkout specification
      deliveryType:
        order.delivery?.deliveryType ||
        (order.deliveryMethod === DeliveryMethod.PICKUP
          ? 'STORE_PICKUP'
          : order.deliveryMethod) ||
        'HOME_DELIVERY',
      subtotal: Number(order.subtotal || 0).toFixed(2),
      discountTotal: Number(order.discountTotal || 0).toFixed(2),
      shippingTotal: Number(
        order.deliveryCost || order.delivery?.shippingTotal || 0,
      ).toFixed(2),
      total: Number(order.totalAmount || 0).toFixed(2),
      itemsCount,
      delivery: mappedDelivery,
      items: mappedItems,
      timeline: mappedTimeline,
    };

    return plainToInstance(CustomerOrderDetailResponseDto, rawMapped, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Alias de compatibilidad hacia findOneByOrderNumber
   */
  async findOneForCustomer(
    customerId: string,
    orderNumber: string,
  ): Promise<CustomerOrderDetailResponseDto> {
    return this.findOneByOrderNumber(customerId, orderNumber);
  }
}
