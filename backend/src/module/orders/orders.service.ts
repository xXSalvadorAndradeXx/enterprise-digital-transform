import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
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
import { ProductStatus } from '../products/enums/product-status.enum';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CheckoutSource } from './enums/checkout-source.enum';
import { CheckoutDto } from './dto/checkout.dto';
import { DeliveryType } from './enums/delivery-type.enum';
import { PaymentMethod } from '../payments/enums/payment-method.enum';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { CustomerAddress } from '../users/entities/customer-address.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { CheckoutIdempotency } from './entities/checkout-idempotency.entity';
import { CheckoutIdempotencyStatus } from './enums/checkout-idempotency-status.enum';
import { CHECKOUT_CONFIG } from './config/checkout.config';

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
    @InjectRepository(CheckoutIdempotency)
    private readonly idempotencyRepository: Repository<CheckoutIdempotency>,
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
  /**
   * Checkout autoritativo: valida, calcula precios, crea orden y pago en una transacción.
   */
  async checkout(checkoutDto: CheckoutDto, userId?: string, idempotencyKey?: string): Promise<Order> {

    const {
      source,
      items,
      contact,
      delivery,
      paymentMethod,
      card,
      saveAddress,
    } = checkoutDto;

    // 1. Validar combinación prohibida de método de pago y tipo de entrega
    if (
      paymentMethod === PaymentMethod.PAY_AT_STORE &&
      delivery.deliveryType === DeliveryType.HOME_DELIVERY
    ) {
      throw new BadRequestException({
        message: 'Combinación de método de pago y tipo de entrega no permitida',
        code: 'INVALID_PAYMENT_COMBINATION',
      });
    }

    // 2. Normalizar y validar datos de contacto
    const emailNormal = contact.email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailNormal)) {
      throw new BadRequestException('Formato de correo electrónico inválido (RFC 5322)');
    }

    const phoneClean = contact.phone.trim().replace(/[^\d+]/g, '');
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneClean)) {
      throw new BadRequestException('Formato de teléfono inválido (debe cumplir formato E.164)');
    }

    if (contact.dui) {
      const cleanDui = contact.dui.replace(/-/g, '').trim();
      if (cleanDui.length !== 9 || !/^\d{9}$/.test(cleanDui)) {
        throw new BadRequestException('El formato de DUI debe ser de 9 dígitos numéricos.');
      }
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        sum += parseInt(cleanDui[i]) * (9 - i);
      }
      const rem = sum % 10;
      const validator = rem === 0 ? 0 : 10 - rem;
      if (validator !== parseInt(cleanDui[8])) {
        throw new BadRequestException('El DUI ingresado no es válido (dígito verificador incorrecto).');
      }
    }

    // 3. Resolución de Comprador
    let customerId: string | null = null;
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`Cliente con ID ${userId} no encontrado`);
      }
      if (!user.isActive) {
        throw new BadRequestException({
          message: 'El cliente no se encuentra activo',
          code: 'CUSTOMER_INACTIVE',
        });
      }
      customerId = user.id;
    }

    // 4. Mapear DeliveryType (DTO) a DeliveryMethod (entidad) y validar territorialidad/sucursales
    const deliveryMethod =
      delivery.deliveryType === DeliveryType.HOME_DELIVERY
        ? DeliveryMethod.HOME_DELIVERY
        : DeliveryMethod.PICKUP;

    if (delivery.deliveryType === DeliveryType.HOME_DELIVERY) {
      const { departmentId, districtId, city, addressLine, branchId } = delivery;
      if (!departmentId || !districtId || !city || !addressLine) {
        throw new BadRequestException({
          message: 'Dirección completa es requerida para entrega a domicilio',
          code: 'INVALID_DELIVERY_DATA',
        });
      }
      if (branchId) {
        delete (delivery as any).branchId;
      }
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { validateDepartmentDistrict } = require('../../../common/utils/address.util');
      if (!validateDepartmentDistrict(departmentId, districtId)) {
        throw new BadRequestException({
          message: 'Departamento y distrito no coinciden o tienen formato inválido',
          code: 'INVALID_DELIVERY_DATA',
        });
      }
    } else if (delivery.deliveryType === DeliveryType.STORE_PICKUP) {
      const { branchId, departmentId, districtId, city, addressLine } = delivery;
      if (!branchId) {
        throw new BadRequestException({
          message: 'branchId es obligatorio para retiro en tienda',
          code: 'INVALID_DELIVERY_DATA',
        });
      }
      if (departmentId || districtId || city || addressLine) {
        delete (delivery as any).departmentId;
        delete (delivery as any).districtId;
        delete (delivery as any).city;
        delete (delivery as any).addressLine;
      }
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      if (!branch) {
        throw new NotFoundException({
          message: `Sucursal con ID ${branchId} no encontrada`,
          code: 'BRANCH_NOT_FOUND',
        });
      }
      if (!branch.isActive) {
        throw new BadRequestException({
          message: 'La sucursal seleccionada no está activa',
          code: 'BRANCH_NOT_AVAILABLE_FOR_PICKUP',
        });
      }
      if (!branch.allowsPickup) {
        throw new BadRequestException({
          message: 'La sucursal seleccionada no permite retiro en tienda',
          code: 'BRANCH_NOT_AVAILABLE_FOR_PICKUP',
        });
      }
    }

    // 5. Validación e inicio de adquisición de Idempotencia
    const requestHash = idempotencyKey ? this.generateRequestHash(checkoutDto) : '';

    if (idempotencyKey) {
      // Eliminar registro expirado si lo hubiere
      await this.idempotencyRepository.createQueryBuilder()
        .delete()
        .where('key = :key AND expiresAt <= :now', { key: idempotencyKey, now: new Date() })
        .execute();

      const existing = await this.idempotencyRepository.findOne({
        where: { key: idempotencyKey },
      });

      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new UnprocessableEntityException({
            message: 'La Idempotency-Key ya ha sido utilizada con un payload diferente.',
            code: 'IDEMPOTENCY_KEY_REUSED',
          });
        }
        if (existing.status === CheckoutIdempotencyStatus.PROCESSING) {
          throw new ConflictException({
            message: 'El checkout asociado a esta solicitud todavía está siendo procesado.',
            code: 'CHECKOUT_ALREADY_PROCESSING',
          });
        }
        if (existing.status === CheckoutIdempotencyStatus.COMPLETED) {
          return existing.response;
        }
      }
    }

    try {
      return await this.orderRepository.manager.transaction(async (tx) => {
        //Insertar atómicamente la key en estado PROCESSING dentro de la transacción
        if (idempotencyKey) {
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h TTL
          let cartId: string | null = null;
          if (source === CheckoutSource.CART && userId) {
            const cart = await tx.findOne(Cart, {
              where: { user: { id: userId } },
            });
            if (cart) {
              cartId = String(cart.id);
            }
          }

          await tx.createQueryBuilder()
            .insert()
            .into(CheckoutIdempotency)
            .values({
              key: idempotencyKey,
              requestHash,
              source,
              cartId,
              customerId,
              status: CheckoutIdempotencyStatus.PROCESSING,
              expiresAt,
            })
            .execute();
        }

        // Resolver ítems reales basados en el origen (source)
        let itemsToProcess: { variantId: string; quantity: number; size?: string; color?: string; sku?: string }[] = [];
        let userCart: Cart | null = null;

        if (source === CheckoutSource.BUY_NOW) {
          if (!items || items.length === 0) {
            throw new BadRequestException('Los ítems son obligatorios cuando source es BUY_NOW');
          }
          itemsToProcess = items.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity,
            size: (item as any).size,
            color: (item as any).color,
            sku: (item as any).sku,
          }));
        } else if (source === CheckoutSource.CART) {
          if (!userId) {
            throw new BadRequestException('El userId es requerido para realizar checkout desde el carrito');
          }
          userCart = await tx.findOne(Cart, {
            where: { user: { id: userId } },
            relations: ['items', 'items.product', 'items.product.inventory'],
          });
          if (!userCart) {
            throw new NotFoundException({
              message: 'Carrito no encontrado para este usuario',
              code: 'CART_NOT_FOUND',
            });
          }
          if (!userCart.items || userCart.items.length === 0) {
            throw new BadRequestException({
              message: 'El carrito está vacío',
              code: 'CART_EMPTY',
            });
          }
          itemsToProcess = userCart.items.map(item => {
            if (!item.product) {
              throw new BadRequestException('El carrito contiene un producto no válido');
            }
            return {
              variantId: item.product.id,
              quantity: item.quantity,
              size: (item as any).size,
              color: (item as any).color,
              sku: (item as any).sku,
            };
          });
        }

        // Crear objeto Order principal
        const orderNumber = await this.generateUniqueOrderNumber();
        const order = tx.create(Order, {
          orderNumber,
          status: OrderStatus.NEW,
          deliveryMethod,
          subtotal: '0.00',
          discountTotal: '0.00',
          deliveryCost: '0.00',
          totalAmount: '0.00',
          contactSnapshot: {
            fullName: contact.fullName,
            email: emailNormal,
            phone: phoneClean,
            dui: contact.dui || null,
          },
        });

        // Vincular comprador según resolución
        if (customerId) {
          order.customerId = customerId;
          const userObj = await tx.findOne(User, { where: { id: customerId } });
          order.customer = userObj!;
        } else {
          // Crear/usar GuestCustomer
          let guest = await tx.findOne(GuestCustomer, { where: { email: emailNormal } });
          if (!guest) {
            guest = tx.create(GuestCustomer, {
              email: emailNormal,
              name: contact.fullName,
              phone: phoneClean,
            });
            guest = await tx.save(GuestCustomer, guest);
          }
          order.guestCustomer = guest;
          order.guestCustomerId = guest.id;
        }

        order.customerEmail = emailNormal;
        order.customerName = contact.fullName;
        order.customerPhone = phoneClean;

        // D. Procesar y validar ítems contra base de datos
        order.items = [];
        for (const itemDto of itemsToProcess) {
          const product = await tx.findOne(Product, {
            where: { id: itemDto.variantId },
            relations: ['inventory'],
          });
          if (!product) {
            throw new NotFoundException(`Producto con ID ${itemDto.variantId} no encontrado`);
          }
          if (product.status !== ProductStatus.ACTIVE) {
            throw new BadRequestException(`El producto "${product.commercialName}" no está disponible para venta.`);
          }
          if (!product.inventory) {
            throw new BadRequestException(`El producto ${product.id} no tiene inventario asignado`);
          }
          if (Number(product.inventory.stock) < itemDto.quantity) {
            throw new BadRequestException(`Stock insuficiente para el producto ${product.id}`);
          }

          const salePrice = Number(product.salePrice);
          const discount = Number(product.discount || 0);
          const discountAmount = salePrice * (discount / 100);
          const effectivePrice = Number((salePrice - discountAmount).toFixed(2));
          const subtotal = Number((effectivePrice * itemDto.quantity).toFixed(2));

          const orderItem = tx.create(OrderItem, {
            product,
            quantity: itemDto.quantity,
            unitPrice: effectivePrice,
            salePriceSnapshot: salePrice,
            discountSnapshot: discount,
            subtotal,
            size: itemDto.size || null,
            color: itemDto.color || null,
            sku: itemDto.sku || null,
          });
          order.items.push(orderItem);

          // Decrementar stock
          product.inventory.stock = Number(product.inventory.stock) - itemDto.quantity;
          await tx.save(Inventory, product.inventory);
        }

        // E. Si viene de CART, vaciar el carrito
        if (source === CheckoutSource.CART && userCart) {
          await tx.delete(CartItem, { cart: { id: userCart.id } });
        }

        // F. Cálculo de totales
        const calculatedSubtotal = order.items.reduce((s, i) => s + i.subtotal, 0);
        const calculatedDiscountTotal = order.items.reduce((s, i) => {
          const base = i.salePriceSnapshot * i.quantity;
          return s + (base - i.subtotal);
        }, 0);

        let shippingTotal = '0.00';
        if (deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
          if (calculatedSubtotal >= CHECKOUT_CONFIG.FREE_SHIPPING_THRESHOLD) {
            shippingTotal = '0.00';
          } else {
            shippingTotal = CHECKOUT_CONFIG.STANDARD_SHIPPING_FEE.toFixed(2);
          }
        }

        const total = calculatedSubtotal + Number(shippingTotal);
        order.subtotal = calculatedSubtotal.toFixed(2);
        order.discountTotal = calculatedDiscountTotal.toFixed(2);
        order.deliveryCost = shippingTotal;
        order.totalAmount = total.toFixed(2);

        // G. Historial inicial
        const initialHistory = tx.create(OrderStatusHistory, {
          statusBefore: null,
          statusAfter: order.status,
          notes: 'Creación inicial de la orden',
          changedById: customerId || null,
        });
        order.statusHistory = [initialHistory];

        // H. Guardar orden (cascada)
        const savedOrder = await tx.save(Order, order);

        // I. Guardar entrega (OrderDelivery) - Snapshot inmutable
        let orderDelivery: OrderDelivery;
        if (deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
          const { departmentId, districtId, city, addressLine } = delivery;
          const DEPARTMENTS: Record<string, string> = {
            'AH': 'Ahuachapán',
            'CA': 'Cabañas',
            'CH': 'Chalatenango',
            'CU': 'Cuscatlán',
            'LL': 'La Libertad',
            'LP': 'La Paz',
            'LM': 'La Unión',
            'MO': 'Morazán',
            'SM': 'San Miguel',
            'SS': 'San Salvador',
            'SV': 'San Vicente',
            'SA': 'Santa Ana',
            'SO': 'Sonsonate',
            'US': 'Usulután',
          };
          const departmentName = DEPARTMENTS[departmentId!] || departmentId!;
          const districtName = districtId!;

          orderDelivery = tx.create(OrderDelivery, {
            orderId: savedOrder.id,
            deliveryType: DeliveryType.HOME_DELIVERY,
            departmentId,
            districtId,
            departmentName,
            districtName,
            city,
            addressLine,
            shippingTotal,
            trackingNumber: undefined,
            estimatedDeliveryDate: undefined,
            branch: null,
            branchId: null,
            branchName: null,
            branchAddress: null,
            branchPhone: null,
          });
        } else {
          const branch = await tx.findOne(Branch, { where: { id: delivery.branchId } });
          orderDelivery = tx.create(OrderDelivery, {
            orderId: savedOrder.id,
            deliveryType: DeliveryType.STORE_PICKUP,
            shippingTotal: '0.00',
            trackingNumber: undefined,
            estimatedDeliveryDate: undefined,
            branch,
            branchId: branch!.id,
            branchName: branch!.name,
            branchAddress: branch!.address || null,
            branchPhone: branch!.phone || null,
            department: null,
            district: null,
            city: null,
            addressLine: null,
          });
        }
        await tx.save(OrderDelivery, orderDelivery);

        // J. Crear pago asociado
        const payment = tx.create(Payment, {
          orderId: savedOrder.id,
          paymentMethod,
          amount: savedOrder.totalAmount,
          status: PaymentStatus.PENDING,
          cardLastFour: card?.cardLastFour,
          cardBrand: card?.cardBrand,
        });
        await tx.save(Payment, payment);

        // J. Guardar dirección permanente si corresponde
        if (saveAddress && customerId && deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
          if (delivery.isDefault) {
            // Desactivar default en otras direcciones del cliente para unicidad
            await tx.update(CustomerAddress, { userId: customerId }, { isDefault: false });
          }
          const address = tx.create(CustomerAddress, {
            userId: customerId,
            departmentId: delivery.departmentId!,
            districtId: delivery.districtId!,
            city: delivery.city!,
            addressLine: delivery.addressLine!,
            isDefault: !!delivery.isDefault,
          });
          await tx.save(CustomerAddress, address);
        }

        // K. Confirmar idempotencia a COMPLETED
        if (idempotencyKey) {
          await tx.update(
            CheckoutIdempotency,
            { key: idempotencyKey },
            {
              status: CheckoutIdempotencyStatus.COMPLETED,
              orderId: savedOrder.id,
              response: JSON.parse(JSON.stringify(savedOrder)) as any,
            },
          );
        }

        return savedOrder;
      });
    } catch (err: any) {
      if (
        idempotencyKey &&
        (err.code === '23505' ||
          err.message?.includes('unique constraint') ||
          err.message?.includes('duplicate key'))
      ) {
        const existing = await this.idempotencyRepository.findOne({
          where: { key: idempotencyKey },
        });
        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new UnprocessableEntityException({
              message: 'La Idempotency-Key ya ha sido utilizada con un payload diferente.',
              code: 'IDEMPOTENCY_KEY_REUSED',
            });
          }
          if (existing.status === CheckoutIdempotencyStatus.PROCESSING) {
            throw new ConflictException({
              message: 'El checkout asociado a esta solicitud todavía está siendo procesado.',
              code: 'CHECKOUT_ALREADY_PROCESSING',
            });
          }
          if (existing.status === CheckoutIdempotencyStatus.COMPLETED) {
            return existing.response;
          }
        }
      }
      throw err;
    }
  }

  private generateRequestHash(checkoutDto: CheckoutDto): string {
    const normalize = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (Array.isArray(obj)) {
        return obj.map(normalize);
      }
      if (typeof obj === 'object') {
        const sortedKeys = Object.keys(obj).sort();
        const result: any = {};
        for (const key of sortedKeys) {
          result[key] = normalize(obj[key]);
        }
        return result;
      }
      return obj;
    };

    const normalizedPayload = JSON.stringify(
      normalize({
        source: checkoutDto.source,
        items: checkoutDto.items,
        contact: checkoutDto.contact,
        delivery: checkoutDto.delivery,
        paymentMethod: checkoutDto.paymentMethod,
      }),
    );

    return crypto.createHash('sha256').update(normalizedPayload).digest('hex');
  }

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
