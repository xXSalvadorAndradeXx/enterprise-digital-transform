import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatus } from './enums/order-status.enum';
import { User } from '../users/entities/user.entity';
import { GuestCustomer } from './entities/guest-customer.entity';
import { DeliveryMethod } from './enums/delivery-method.enum';
import { Branch } from '../branches/entities/branch.entity';
import { OrderDelivery } from './entities/order-delivery.entity';
import { Product } from '../products/entities/product.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';


@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GuestCustomer)
    private readonly guestCustomerRepository: Repository<GuestCustomer>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const {
      items,
      customerId,
      guestCustomer,
      customerEmail,
      customerName,
      customerPhone,
      deliveryMethod,
      branchId,
      delivery,
      ...orderData
    } = createOrderDto;

    // Generar un orderNumber público único (8 caracteres alfanuméricos)
    const orderNumber = await this.generateUniqueOrderNumber();

    const order = this.orderRepository.create({
      status: (orderData.status as OrderStatus) || OrderStatus.NEW,
      orderNumber,
      subtotal: '0.00',
      discountTotal: '0.00',
      deliveryCost: '0.00',
      totalAmount: '0.00',
    });

    // Manejar cliente autenticado vs cliente invitado con snapshot del comprador
    if (customerId) {
      const user = await this.userRepository.findOne({ where: { id: customerId } });
      if (!user) {
        throw new NotFoundException(`Customer with ID ${customerId} not found`);
      }
      order.customerId = user.id;
      order.customer = user;
      order.guestCustomerId = null;
      order.guestCustomer = null;

      // Snapshot del comprador para inmutabilidad histórica
      order.customerEmail = customerEmail || user.email;
      order.customerName =
        customerName || `${user.firstName} ${user.lastName}`.trim();
      order.customerPhone = customerPhone || null;
    } else if (guestCustomer?.email || customerEmail) {
      const email = guestCustomer?.email || customerEmail!;
      order.customerId = null;
      order.customer = null;

      let guest = await this.guestCustomerRepository.findOne({ where: { email } });
      if (!guest) {
        guest = this.guestCustomerRepository.create({
          email,
          name: guestCustomer?.name || customerName,
          phone: guestCustomer?.phone || customerPhone,
        });
        guest = await this.guestCustomerRepository.save(guest);
      }

      order.guestCustomer = guest;
      order.guestCustomerId = guest.id;

      // Snapshot del comprador para inmutabilidad histórica
      order.customerEmail = email;
      order.customerName = guestCustomer?.name || customerName || guest.name || null;
      order.customerPhone = guestCustomer?.phone || customerPhone || guest.phone || null;
    } else {
      throw new BadRequestException(
        'Must provide either an authenticated customerId or guest customer details (email)',
      );
    }

    // Manejar validación y snapshot del método de entrega (DeliveryMethod y Branch)
    const selectedMethod = deliveryMethod || DeliveryMethod.HOME_DELIVERY;
    order.deliveryMethod = selectedMethod;

    const selectedBranchId = branchId || delivery?.branchId;

    if (selectedMethod === DeliveryMethod.PICKUP) {
      if (!selectedBranchId) {
        throw new BadRequestException('Branch ID is required for pickup delivery method');
      }
      if (
        delivery?.department ||
        delivery?.district ||
        delivery?.city ||
        delivery?.addressLine
      ) {
        throw new BadRequestException(
          'Shipping address fields (department, district, city, addressLine) are not allowed for pickup delivery method',
        );
      }

      const branch = await this.branchRepository.findOne({ where: { id: selectedBranchId } });
      if (!branch) {
        throw new NotFoundException(`Branch with ID ${selectedBranchId} not found`);
      }
      if (!branch.isActive) {
        throw new BadRequestException('The selected branch is not active');
      }
      if (!branch.allowsPickup) {
        throw new BadRequestException('The selected branch does not allow pickup');
      }

      order.delivery = this.orderRepository.manager.create(OrderDelivery, {
        trackingNumber: delivery?.trackingNumber || undefined,
        estimatedDeliveryDate: delivery?.estimatedDeliveryDate
          ? new Date(delivery.estimatedDeliveryDate)
          : undefined,
        branch,
        branchId: branch.id,
        branchName: branch.name,
        branchAddress: branch.address || null,
        branchPhone: branch.phone || null,
        department: null,
        district: null,
        city: null,
        addressLine: null,
      });
    } else {
      // Validar detalles de despacho y dirección para entrega a domicilio
      if (!delivery) {
        throw new BadRequestException('Delivery details are required for home delivery method');
      }
      if (selectedBranchId) {
        throw new BadRequestException('Branch ID is not allowed for home delivery method');
      }
      if (!delivery.department || !delivery.district || !delivery.city || !delivery.addressLine) {
        throw new BadRequestException(
          'Complete shipping address (department, district, city, addressLine) is required for home delivery',
        );
      }

      order.delivery = this.orderRepository.manager.create(OrderDelivery, {
        trackingNumber: delivery.trackingNumber || undefined,
        estimatedDeliveryDate: delivery.estimatedDeliveryDate
          ? new Date(delivery.estimatedDeliveryDate)
          : undefined,
        department: delivery.department || undefined,
        district: delivery.district || undefined,
        city: delivery.city || undefined,
        addressLine: delivery.addressLine || undefined,
        branch: null,
        branchId: null,
        branchName: null,
        branchAddress: null,
        branchPhone: null,
      });
    }

    // Mapear ítems del DTO a entidades OrderItem
    if (items && items.length) {
      order.items = [];
      for (const itemDto of items) {
        const product = await this.productRepository.findOne({
          where: { id: itemDto.productId },
        });
        if (!product) {
          throw new NotFoundException(`Product with ID ${itemDto.productId} not found`);
        }

        // Snapshot del precio de venta base y del descuento
        const salePriceSnapshot = Number(product.salePrice);
        const discountSnapshot = Number(product.discount || 0);

        // Calcular precio unitario (precio efectivo)
        const discountAmount = salePriceSnapshot * (discountSnapshot / 100);
        const calculatedEffectivePrice = Number((salePriceSnapshot - discountAmount).toFixed(2));

        const unitPrice = calculatedEffectivePrice;
        const subtotal = Number((unitPrice * itemDto.quantity).toFixed(2));

        const orderItem = this.orderRepository.manager.create(OrderItem, {
          product,
          quantity: itemDto.quantity,
          unitPrice,
          salePriceSnapshot,
          discountSnapshot,
          subtotal,
          size: itemDto.size || null,
          color: itemDto.color || null,
          sku: itemDto.sku || null,
        });
        order.items.push(orderItem);
      }
    }

    // Calcular totales de la orden
    const calculatedSubtotal = order.items ? order.items.reduce((sum, item) => sum + item.subtotal, 0) : 0;
    const calculatedDiscountTotal = order.items ? order.items.reduce((sum, item) => {
      const basePrice = item.salePriceSnapshot * item.quantity;
      return sum + (basePrice - item.subtotal);
    }, 0) : 0;
    const selectedDeliveryCost = selectedMethod === DeliveryMethod.PICKUP ? 0 : (createOrderDto.deliveryCost || 0);
    const calculatedTotalAmount = calculatedSubtotal + selectedDeliveryCost;

    order.subtotal = calculatedSubtotal.toFixed(2);
    order.discountTotal = calculatedDiscountTotal.toFixed(2);
    order.deliveryCost = selectedDeliveryCost.toFixed(2);
    order.totalAmount = calculatedTotalAmount.toFixed(2);

    // Crear el historial de estado inicial (null -> estado actual)
    const initialHistory = this.orderRepository.manager.create(OrderStatusHistory, {
      statusBefore: null,
      statusAfter: order.status,
      notes: 'Creación inicial de la orden',
      changedById: order.customerId || null,
    });
    order.statusHistory = [initialHistory];

    // TypeORM guardará en cascada las entidades relacionadas (items, delivery, etc.)
    return await this.orderRepository.save(order);
  }

  /**
   * Generar un orderNumber alfanumérico de 8 caracteres y garantizar su unicidad.
   * Reintenta hasta 5 veces antes de lanzar un error.
   */
  private async generateUniqueOrderNumber(attempt = 1): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let value = '';
    for (let i = 0; i < 8; i++) {
      value += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const exists = await this.orderRepository.findOne({ where: { orderNumber: value } });
    if (exists) {
      if (attempt >= 5) {
        throw new InternalServerErrorException(
          'Failed to generate a unique orderNumber after multiple attempts',
        );
      }
      return this.generateUniqueOrderNumber(attempt + 1);
    }
    return value;
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'delivery', 'delivery.branch', 'customer', 'guestCustomer', 'statusHistory'],
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const { status: newStatus, changedById, notes } = updateStatusDto;

    return await this.orderRepository.manager.transaction(async (transactionalEntityManager) => {
      const order = await transactionalEntityManager.findOne(Order, {
        where: { id },
        relations: ['statusHistory'],
      });

      if (!order) {
        throw new NotFoundException(`Orden con ID ${id} no encontrada`);
      }

      const oldStatus = order.status;
      if (oldStatus === newStatus) {
        return order; // No hay cambio de estado
      }

      // Validar la transición de estado según las reglas de negocio y el método de entrega
      if (!this.isValidTransition(oldStatus, newStatus, order.deliveryMethod)) {
        throw new BadRequestException(
          `Transición de estado inválida de ${oldStatus} a ${newStatus} para el método de entrega ${order.deliveryMethod}`,
        );
      }

      // Actualizar el estado de la orden
      order.status = newStatus;

      // Crear el registro de historial
      const historyEntry = transactionalEntityManager.create(OrderStatusHistory, {
        order,
        statusBefore: oldStatus,
        statusAfter: newStatus,
        changedById: changedById || null,
        notes: notes || null,
      });

      await transactionalEntityManager.save(Order, order);
      await transactionalEntityManager.save(OrderStatusHistory, historyEntry);

      return order;
    });
  }

  /**
   * Valida si la transición entre el estado actual y el nuevo es permitida
   * según las reglas del flujo de entrega de la orden.
   */
  private isValidTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    deliveryMethod: DeliveryMethod,
  ): boolean {
    if (currentStatus === newStatus) return true;

    // Regla de cancelación: cualquier estado previo no final (no DELIVERED ni CANCELLED) puede pasar a CANCELLED
    if (newStatus === OrderStatus.CANCELLED) {
      return currentStatus !== OrderStatus.DELIVERED && currentStatus !== OrderStatus.CANCELLED;
    }

    if (deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
      switch (currentStatus) {
        case OrderStatus.NEW:
          return newStatus === OrderStatus.PENDING;
        case OrderStatus.PENDING:
          return newStatus === OrderStatus.ON_ROUTE;
        case OrderStatus.ON_ROUTE:
          return newStatus === OrderStatus.DELIVERED;
        default:
          return false;
      }
    } else if (deliveryMethod === DeliveryMethod.PICKUP) {
      switch (currentStatus) {
        case OrderStatus.NEW:
          return newStatus === OrderStatus.PENDING;
        case OrderStatus.PENDING:
          return newStatus === OrderStatus.READY_FOR_PICKUP;
        case OrderStatus.READY_FOR_PICKUP:
          return newStatus === OrderStatus.DELIVERED;
        default:
          return false;
      }
    }

    return false;
  }
}
