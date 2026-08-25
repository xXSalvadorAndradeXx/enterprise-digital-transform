import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
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
import { InventoryStatus } from '../inventory/enums/inventory-status.enum';
import { InventoryReservation } from '../inventory/entities/inventory-reservation.entity';
import { ReservationStatus } from '../inventory/enums/reservation-status.enum';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { MovementType } from '../inventory/enums/movement-type.enum';
import { MovementChannel } from '../inventory/enums/movement-channel.enum';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { CustomerAddress } from '../users/entities/customer-address.entity';
import { Cart } from '../cart/entities/cart.entity';
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
  async checkout(checkoutDto: CheckoutDto, userId?: string, idempotencyKey?: string): Promise<any> {

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
      const { validateDepartmentDistrict } = require('../../common/utils/address.util');
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
          throw new BadRequestException({
            success: false,
            error: {
              code: 'IDEMPOTENCY_KEY_REUSED',
              message: 'La Idempotency-Key especificada ya fue utilizada con un payload diferente',
            },
          });
        }
        if (existing.status === CheckoutIdempotencyStatus.PROCESSING) {
          throw new ConflictException({
            success: false,
            error: {
              code: 'CHECKOUT_ALREADY_PROCESSING',
              message: 'El checkout asociado a esta solicitud todavía está siendo procesado',
            },
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
        let itemsToProcess: { variantId: string; quantity: number; size?: string; color?: string; sku?: string; referencePrice?: number }[] = [];
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
            referencePrice: item.priceAtAdded ? Number(item.priceAtAdded) : undefined,
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
            const dtoItem = items?.find(di => di.variantId === item.product.id);
            const refPrice = dtoItem?.priceAtAdded ? Number(dtoItem.priceAtAdded) : Number(item.unitPrice);
            return {
              variantId: item.product.id,
              quantity: item.quantity,
              size: (item as any).size,
              color: (item as any).color,
              sku: (item as any).sku,
              referencePrice: refPrice,
            };
          });
        }

        // Calcular plazo de pago a 3 días (72 horas) para PAY_AT_STORE
        const paymentDeadline =
          paymentMethod === PaymentMethod.PAY_AT_STORE
            ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            : null;

        // Crear objeto Order principal
        const orderNumber = await this.generateUniqueOrderNumber(1, tx);
        const order = tx.create(Order, {
          orderNumber,
          status: OrderStatus.NEW,
          deliveryMethod,
          subtotal: '0.00',
          discountTotal: '0.00',
          deliveryCost: '0.00',
          totalAmount: '0.00',
          paymentDeadline,
          contactSnapshot: {
            fullName: contact.fullName,
            email: emailNormal,
            phone: phoneClean,
            dui: contact.dui || null,
          },
        });

        let rawGuestAccessToken: string | null = null;

        // Vincular comprador según resolución
        if (customerId) {
          order.customerId = customerId;
          order.guestOrderAccessTokenHash = null;
          const userObj = await tx.findOne(User, { where: { id: customerId } });
          order.customer = userObj!;
        } else {
          // Generar token de acceso seguro para la orden de invitado (Requerimientos 1 y 2)
          rawGuestAccessToken = crypto.randomBytes(32).toString('hex');
          order.guestOrderAccessTokenHash = crypto
            .createHash('sha256')
            .update(rawGuestAccessToken)
            .digest('hex');

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

        // D. Procesar, validar y recalcular precios, stock e inmutabilidad en tiempo real
        order.items = [];
        const priceChangedDetails: any[] = [];
        let totalSubtotal = 0;
        let totalDiscount = 0;
        let totalEffective = 0;
        let hasPriceChanged = false;

        // 1. Ordenar variantIds determinísticamente (por ID ascendente) para evitar deadlocks (Requerimiento 1)
        const sortedVariantIds = Array.from(
          new Set(itemsToProcess.map((item) => item.variantId)),
        ).sort();

        // 2. Adquirir bloqueos pesimistas (pessimistic_write / SELECT ... FOR UPDATE) sobre inventarios (Requerimiento 1)
        const lockedInventoriesMap = new Map<string, Inventory>();
        for (const variantId of sortedVariantIds) {
          const lockedInv = await tx
            .createQueryBuilder(Inventory, 'inv')
            .setLock('pessimistic_write')
            .where('inv.productId = :variantId', { variantId })
            .getOne();

          if (lockedInv) {
            lockedInventoriesMap.set(variantId, lockedInv);
          }
        }

        const loadedItemsData: {
          product: Product;
          inventory: Inventory;
          itemDto: typeof itemsToProcess[0];
          salePrice: number;
          effectivePrice: number;
          subtotal: number;
        }[] = [];

        const stockInsufficientDetails: {
          variantId: string;
          requestedQuantity: number;
          availableStock: number;
        }[] = [];

        for (const itemDto of itemsToProcess) {
          const product = await tx.findOne(Product, {
            where: { id: itemDto.variantId },
            relations: ['inventory'],
          });
          if (!product) {
            throw new NotFoundException(`Producto con ID ${itemDto.variantId} no encontrado`);
          }
          if (product.status !== ProductStatus.ACTIVE || !product.isActive || !product.isPublished || product.deletedAt !== null) {
            throw new BadRequestException(`El producto "${product.commercialName}" no está disponible para venta.`);
          }
          
          const variant = product;
          if (variant.productId !== product.id) {
            throw new BadRequestException('La variante no pertenece al producto');
          }

          const inventory = lockedInventoriesMap.get(itemDto.variantId) || product.inventory;
          if (!inventory) {
            throw new BadRequestException(`El producto ${product.id} no tiene inventario asignado`);
          }

          // 3. Revalidar el stock disponible autoritativo post-lock: availableStock = physicalStock - reservedStock (Requerimientos 2 & 4)
          const physicalStock = Number(inventory.stock || 0);
          const reservedStock = Number(inventory.reserved || 0);
          const availableStock = physicalStock - reservedStock;

          if (availableStock < itemDto.quantity) {
            stockInsufficientDetails.push({
              variantId: itemDto.variantId,
              requestedQuantity: itemDto.quantity,
              availableStock: Math.max(0, availableStock),
            });
          }

          // Recálculo canónico de precios y descuentos vigentes
          const now = new Date();
          let isDiscountActive = false;
          if (product.discount && product.discount > 0) {
            const starts = product.discountStartsAt ? new Date(product.discountStartsAt) : null;
            const ends = product.discountEndsAt ? new Date(product.discountEndsAt) : null;
            const hasStarted = !starts || now >= starts;
            const hasNotEnded = !ends || now <= ends;
            if (hasStarted && hasNotEnded) {
              isDiscountActive = true;
            }
          }

          const salePrice = Number(product.salePrice);
          const discountPercentage = isDiscountActive ? Number(product.discount || 0) : 0;
          const discountAmount = salePrice * (discountPercentage / 100);
          const effectivePrice = Number((salePrice - discountAmount).toFixed(2));
          const lineBaseTotal = Number((salePrice * itemDto.quantity).toFixed(2));
          const lineTotal = Number((effectivePrice * itemDto.quantity).toFixed(2));
          const lineDiscountTotal = Number((lineBaseTotal - lineTotal).toFixed(2));

          totalSubtotal += lineBaseTotal;
          totalDiscount += lineDiscountTotal;
          totalEffective += lineTotal;

          // Detección de fluctuación de precios (PRICE_CHANGED)
          if (itemDto.referencePrice !== undefined && Number(itemDto.referencePrice.toFixed(2)) !== effectivePrice) {
            hasPriceChanged = true;
          }

          priceChangedDetails.push({
            variantId: itemDto.variantId,
            salePrice: salePrice.toFixed(2),
            effectivePrice: effectivePrice.toFixed(2),
            quantity: itemDto.quantity,
            lineTotal: lineTotal.toFixed(2),
          });

          loadedItemsData.push({
            product,
            inventory,
            itemDto,
            salePrice,
            effectivePrice,
            subtotal: lineTotal,
          });
        }

        // 4. Si cualquier variante tiene stock insuficiente, abortar transacción completa (Requerimiento 5)
        if (stockInsufficientDetails.length > 0) {
          throw new UnprocessableEntityException({
            success: false,
            error: {
              code: 'STOCK_INSUFFICIENT',
              message: 'Uno o más productos no tienen stock suficiente',
              details: stockInsufficientDetails,
            },
          });
        }

        // Si se detecta fluctuación de precios, detenemos el flujo y lanzamos el error estructurado
        if (hasPriceChanged) {
          throw new ConflictException({
            success: false,
            error: {
              code: 'PRICE_CHANGED',
              message: 'Uno o más productos cambiaron de precio',
              details: {
                items: priceChangedDetails,
                subtotal: totalSubtotal.toFixed(2),
                discountTotal: totalDiscount.toFixed(2),
                effectiveSubtotal: totalEffective.toFixed(2),
              },
            },
          });
        }

        // 5. Crear ítems de orden
        for (const loaded of loadedItemsData) {
          const { product, itemDto, salePrice, effectivePrice, subtotal } = loaded;
          
          const orderItem = tx.create(OrderItem, {
            product,
            quantity: itemDto.quantity,
            unitPrice: effectivePrice,
            salePriceSnapshot: salePrice,
            discountSnapshot: product.discount || 0,
            subtotal,
            size: itemDto.size || null,
            color: itemDto.color || null,
            sku: itemDto.sku || null,
          });
          order.items.push(orderItem);
        }

        // E. Si viene de CART, vaciar el carrito
        if (source === CheckoutSource.CART && userCart) {
          await tx.delete(CartItem, { cart: { id: userCart.id } });
        }

        // F. Cálculo de totales
        const calculatedSubtotal = totalEffective;
        const calculatedDiscountTotal = totalDiscount;

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

        // I. Aplicar comportamiento de inventario según paymentMethod (Requerimientos 3 y 4)
        for (const loaded of loadedItemsData) {
          const { product, inventory, itemDto } = loaded;

          if (paymentMethod === PaymentMethod.PAY_AT_STORE) {
            // PAY_AT_STORE -> Reserva de inventario (incrementa reserved)
            inventory.reserved = Number(inventory.reserved || 0) + itemDto.quantity;
            await tx.save(Inventory, inventory);

            // Crear registro explícito de reserva vinculado a la orden
            const reservation = tx.create(InventoryReservation, {
              orderId: savedOrder.id,
              productId: product.id,
              inventoryId: inventory.id,
              quantity: itemDto.quantity,
              status: ReservationStatus.ACTIVE,
            });
            await tx.save(InventoryReservation, reservation);
          } else {
            // CARD / Pago Aprobado -> Consumo definitivo de inventario
            const stockBefore = Number(inventory.stock || 0);
            const newStock = stockBefore - itemDto.quantity;
            inventory.stock = newStock;

            if (newStock <= 0) {
              inventory.status = InventoryStatus.OUT_OF_STOCK;
            }
            await tx.save(Inventory, inventory);

            // Registrar movimiento Kardex definitivo
            const movement = tx.create(InventoryMovement, {
              type: MovementType.OUT,
              quantity: itemDto.quantity,
              stockBefore,
              stockAfter: newStock,
              notes: `Consumo definitivo por checkout e-commerce (Pago Tarjeta)`,
              referenceId: savedOrder.id,
              channel: MovementChannel.ECOMMERCE,
              productId: product.id,
            });
            await tx.save(InventoryMovement, movement);
          }
        }

        // J. Guardar entrega (OrderDelivery) - Snapshot inmutable
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

        // Evaluar resultado de pago simulado para CARD (Requerimiento 1, 3, 4)
        if (paymentMethod === PaymentMethod.CARD && card?.simulateSuccess === false) {
          throw new BadRequestException({
            success: false,
            error: {
              code: 'PAYMENT_FAILED',
              message: 'El pago con tarjeta fue rechazado por la entidad emisora',
            },
          });
        }

        const initialPaymentStatus =
          paymentMethod === PaymentMethod.CARD
            ? PaymentStatus.APPROVED
            : PaymentStatus.PENDING;

        // K. Crear pago asociado con metadatos permitidos (sin PAN ni CVV)
        const payment = tx.create(Payment, {
          orderId: savedOrder.id,
          paymentMethod,
          amount: savedOrder.totalAmount,
          status: initialPaymentStatus,
          cardLastFour: card?.cardLastFour || null,
          cardBrand: card?.cardBrand || null,
          approvedAt: initialPaymentStatus === PaymentStatus.APPROVED ? new Date() : null,
          responseCode: initialPaymentStatus === PaymentStatus.APPROVED ? '200' : 'PENDING',
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

        // K. Si source = CART, vaciar/marcar el carrito como CHECKED_OUT (Requerimiento 11 y 12)
        if (source === CheckoutSource.CART && userCart) {
          await tx.delete(CartItem, { cart: { id: userCart.id } });
        }

        // L. Actualizar métricas de Customer una sola vez con marca de conteo (Requerimientos 13 y 14)
        if (customerId && !savedOrder.customerMetricsCountedAt) {
          savedOrder.customerMetricsCountedAt = new Date();
          await tx.save(Order, savedOrder);

          const userObj = await tx.findOne(User, { where: { id: customerId } });
          if (userObj) {
            userObj.totalOrders = Number(userObj.totalOrders || 0) + 1;
            const currentSpent = Number(userObj.totalSpent || 0);
            const orderTotal = Number(savedOrder.totalAmount || 0);
            userObj.totalSpent = (currentSpent + orderTotal).toFixed(2);
            userObj.lastOrderAt = savedOrder.createdAt || new Date();
            await tx.save(User, userObj);
          }
        }

        if (rawGuestAccessToken) {
          (savedOrder as any).guestOrderAccessToken = rawGuestAccessToken;
        }

        // M. Construir y guardar responseBody inmutable en la Idempotencia (Requerimientos 15, 16 y 17)
        const responseBody = {
          success: true,
          data: {
            orderNumber: savedOrder.orderNumber,
            status: savedOrder.status,
            paymentMethod,
            paymentStatus: payment.status,
            paymentDeadline: savedOrder.paymentDeadline ? savedOrder.paymentDeadline.toISOString() : null,
            subtotal: savedOrder.subtotal,
            discountTotal: savedOrder.discountTotal,
            shippingTotal: savedOrder.deliveryCost,
            total: savedOrder.totalAmount,
            ...(rawGuestAccessToken ? { guestOrderAccessToken: rawGuestAccessToken } : {}),
          },
        };

        if (idempotencyKey) {
          await tx.update(
            CheckoutIdempotency,
            { key: idempotencyKey },
            {
              status: CheckoutIdempotencyStatus.COMPLETED,
              response: responseBody as any,
            },
          );
        }

        return responseBody;
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

  private async generateUniqueOrderNumber(attempt = 1, manager?: EntityManager): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let value = '';
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      value += chars[bytes[i] % chars.length];
    }
    const repo = manager ? manager.getRepository(Order) : this.orderRepository;
    const exists = await repo.findOne({ where: { orderNumber: value } });
    if (exists) {
      if (attempt >= 5) {
        throw new InternalServerErrorException(
          'No se pudo generar un orderNumber único después de varios intentos',
        );
      }
      return this.generateUniqueOrderNumber(attempt + 1, manager);
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

  /**
   * Consulta pública autorizada por orderNumber de 8 caracteres (Requerimientos 4 a 12)
   */
  async findOneByOrderNumber(
    orderNumber: string,
    user?: any,
    accessToken?: string,
  ): Promise<Partial<Order>> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['items', 'delivery', 'delivery.branch', 'customer', 'guestCustomer', 'statusHistory'],
    });

    if (!order) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'El pedido solicitado no existe',
        },
      });
    }

    let isAuthorized = false;

    // 1. Verificación de JWT Administrativo (RBAC)
    if (
      user &&
      (user.role === 'ADMIN' ||
        (Array.isArray(user.roles) && user.roles.includes('ADMIN')) ||
        (Array.isArray(user.permissions) && user.permissions.includes('orders:read')))
    ) {
      isAuthorized = true;
    }

    // 2. Verificación de JWT de Cliente (Ownership)
    if (!isAuthorized && user && user.id) {
      if (order.customerId && order.customerId === user.id) {
        isAuthorized = true;
      } else {
        throw new ForbiddenException({
          success: false,
          error: {
            code: 'ORDER_FORBIDDEN',
            message: 'No tiene autorización para consultar este pedido',
          },
        });
      }
    }

    // 3. Verificación de Pedido Invitado (customerId = null) vía X-Order-Access-Token
    if (!isAuthorized && !order.customerId) {
      if (!accessToken) {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 'ORDER_ACCESS_TOKEN_REQUIRED',
            message: 'Se requiere un token de acceso para consultar este pedido',
          },
        });
      }

      const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
      if (order.guestOrderAccessTokenHash && tokenHash === order.guestOrderAccessTokenHash) {
        isAuthorized = true;
      } else {
        throw new ForbiddenException({
          success: false,
          error: {
            code: 'ORDER_FORBIDDEN',
            message: 'No tiene autorización para consultar este pedido',
          },
        });
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'ORDER_FORBIDDEN',
          message: 'No tiene autorización para consultar este pedido',
        },
      });
    }

    // Sanitización de la respuesta (Requerimiento 12)
    const sanitizedOrder = { ...order };
    delete sanitizedOrder.guestOrderAccessTokenHash;

    return sanitizedOrder;
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const { status: newStatus, changedById, notes } = updateStatusDto;

    return await this.orderRepository.manager.transaction(async (tx) => {
      const order = await tx.findOne(Order, {
        where: { id },
        relations: ['statusHistory'],
      });

      if (!order) {
        throw new NotFoundException(`Orden con ID ${id} no encontrada`);
      }

      const oldStatus = order.status;
      if (oldStatus === newStatus) {
        return order;
      }

      if (!this.isValidTransition(oldStatus, newStatus, order.deliveryMethod)) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: 'La transición de estado solicitada no está permitida',
            details: {
              currentStatus: oldStatus,
              requestedStatus: newStatus,
            },
          },
        });
      }

      // Si la orden se cancela, liberar reservas e inhabilitar pago de forma atómica
      if (newStatus === OrderStatus.CANCELLED) {
        await this.releaseOrderReservations(order.id, tx);
        await tx.update(Payment, { orderId: order.id, status: PaymentStatus.PENDING }, { status: PaymentStatus.CANCELLED });
      }

      order.status = newStatus;

      const historyEntry = tx.create(OrderStatusHistory, {
        order,
        statusBefore: oldStatus,
        statusAfter: newStatus,
        changedById: changedById || null,
        notes: notes || null,
      });

      await tx.save(Order, order);
      await tx.save(OrderStatusHistory, historyEntry);

      return order;
    });
  }

  /**
   * Actualiza el estado de una orden buscando por orderNumber público de 8 caracteres (PATCH /admin/orders/:orderNumber/status)
   */
  async updateStatusByOrderNumber(
    orderNumber: string,
    updateStatusDto: UpdateOrderStatusDto,
    changedById?: string,
  ): Promise<Order> {
    const { status: newStatus, notes } = updateStatusDto;

    return await this.orderRepository.manager.transaction(async (tx) => {
      const order = await tx.findOne(Order, {
        where: { orderNumber },
        relations: ['statusHistory'],
      });

      if (!order) {
        throw new NotFoundException({
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'El pedido solicitado no existe',
          },
        });
      }

      const oldStatus = order.status;
      if (oldStatus === newStatus) {
        return order;
      }

      if (!this.isValidTransition(oldStatus, newStatus, order.deliveryMethod)) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: 'La transición de estado solicitada no está permitida',
            details: {
              currentStatus: oldStatus,
              requestedStatus: newStatus,
            },
          },
        });
      }

      if (newStatus === OrderStatus.CANCELLED) {
        await this.releaseOrderReservations(order.id, tx);
        await tx.update(Payment, { orderId: order.id, status: PaymentStatus.PENDING }, { status: PaymentStatus.CANCELLED });
      }

      order.status = newStatus;

      const historyEntry = tx.create(OrderStatusHistory, {
        order,
        statusBefore: oldStatus,
        statusAfter: newStatus,
        changedById: changedById || updateStatusDto.changedById || null,
        notes: notes || null,
      });

      await tx.save(Order, order);
      await tx.save(OrderStatusHistory, historyEntry);

      return order;
    });
  }

  /**
   * Valida si la transición entre el estado actual y el nuevo es permitida
   * según la máquina de estados canónica y el método de entrega de la orden.
   */
  private isValidTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    deliveryMethod: DeliveryMethod,
  ): boolean {
    if (currentStatus === newStatus) return true;

    // Los estados terminales (DELIVERED y CANCELLED) no permiten ninguna transición posterior
    if (currentStatus === OrderStatus.DELIVERED || currentStatus === OrderStatus.CANCELLED) {
      return false;
    }

    // Regla de cancelación: cualquier estado previo no terminal puede transicionar a CANCELLED
    if (newStatus === OrderStatus.CANCELLED) {
      return true;
    }

    if (deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
      // Para HOME_DELIVERY: READY_FOR_PICKUP está prohibido
      if (newStatus === OrderStatus.READY_FOR_PICKUP) return false;

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
      // Para STORE_PICKUP / PICKUP: ON_ROUTE está prohibido
      if (newStatus === OrderStatus.ON_ROUTE) return false;

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

  async checkoutPreview(checkoutDto: CheckoutDto, userId?: string, xCartToken?: string): Promise<any> {
    const {
      source,
      items,
      contact,
      delivery,
      paymentMethod,
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

    // 5. Resolver ítems reales basados en el origen (source)
    let itemsToProcess: { variantId: string; quantity: number; size?: string; color?: string; sku?: string; referencePrice?: number }[] = [];
    const cartRepository = this.orderRepository.manager.getRepository(Cart);
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
        referencePrice: item.priceAtAdded ? Number(item.priceAtAdded) : undefined,
      }));
    } else if (source === CheckoutSource.CART) {
      if (userId) {
        userCart = await cartRepository.findOne({
          where: { user: { id: userId } },
          relations: ['items', 'items.product', 'items.product.inventory'],
        });
      } else if (xCartToken) {
        const cartId = parseInt(xCartToken, 10);
        if (!isNaN(cartId)) {
          userCart = await cartRepository.findOne({
            where: { id: cartId },
            relations: ['items', 'items.product', 'items.product.inventory'],
          });
        }
      }

      if (!userCart) {
        throw new NotFoundException({
          message: 'Carrito no encontrado',
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
        const dtoItem = items?.find(di => di.variantId === item.product.id);
        const refPrice = dtoItem?.priceAtAdded ? Number(dtoItem.priceAtAdded) : Number(item.unitPrice);
        return {
          variantId: item.product.id,
          quantity: item.quantity,
          size: (item as any).size,
          color: (item as any).color,
          sku: (item as any).sku,
          referencePrice: refPrice,
        };
      });
    }

    // 6. Recalcular stock y precios en tiempo real
    const priceChangedDetails: any[] = [];
    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalEffective = 0;
    let hasPriceChanged = false;

    for (const itemDto of itemsToProcess) {
      const product = await this.productRepository.findOne({
        where: { id: itemDto.variantId },
        relations: ['inventory'],
      });
      if (!product) {
        throw new NotFoundException(`Producto con ID ${itemDto.variantId} no encontrado`);
      }
      if (product.status !== ProductStatus.ACTIVE || !product.isActive || !product.isPublished || product.deletedAt !== null) {
        throw new BadRequestException(`El producto "${product.commercialName}" no está disponible para venta.`);
      }

      const variant = product;
      if (variant.productId !== product.id) {
        throw new BadRequestException('La variante no pertenece al producto');
      }

      if (!product.inventory) {
        throw new BadRequestException(`El producto ${product.id} no tiene inventario asignado`);
      }
      if (Number(product.inventory.stock) < itemDto.quantity) {
        throw new BadRequestException({
          message: `Stock insuficiente para el producto ${product.id}`,
          code: 'INSUFFICIENT_STOCK',
        });
      }

      // Recálculo canónico de precios y descuentos vigentes
      const now = new Date();
      let isDiscountActive = false;
      if (product.discount && product.discount > 0) {
        const starts = product.discountStartsAt ? new Date(product.discountStartsAt) : null;
        const ends = product.discountEndsAt ? new Date(product.discountEndsAt) : null;
        const hasStarted = !starts || now >= starts;
        const hasNotEnded = !ends || now <= ends;
        if (hasStarted && hasNotEnded) {
          isDiscountActive = true;
        }
      }

      const salePrice = Number(product.salePrice);
      const discountPercentage = isDiscountActive ? Number(product.discount || 0) : 0;
      const discountAmount = salePrice * (discountPercentage / 100);
      const effectivePrice = Number((salePrice - discountAmount).toFixed(2));
      const lineBaseTotal = Number((salePrice * itemDto.quantity).toFixed(2));
      const lineTotal = Number((effectivePrice * itemDto.quantity).toFixed(2));
      const lineDiscountTotal = Number((lineBaseTotal - lineTotal).toFixed(2));

      totalSubtotal += lineBaseTotal;
      totalDiscount += lineDiscountTotal;
      totalEffective += lineTotal;

      // Detección de fluctuación de precios (PRICE_CHANGED)
      if (itemDto.referencePrice !== undefined && Number(itemDto.referencePrice.toFixed(2)) !== effectivePrice) {
        hasPriceChanged = true;
      }

      priceChangedDetails.push({
        variantId: itemDto.variantId,
        salePrice: salePrice.toFixed(2),
        effectivePrice: effectivePrice.toFixed(2),
        quantity: itemDto.quantity,
        lineTotal: lineTotal.toFixed(2),
      });
    }

    if (hasPriceChanged) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'PRICE_CHANGED',
          message: 'Uno o más productos cambiaron de precio',
          details: {
            items: priceChangedDetails,
            subtotal: totalSubtotal.toFixed(2),
            discountTotal: totalDiscount.toFixed(2),
            effectiveSubtotal: totalEffective.toFixed(2),
          },
        },
      });
    }

    // 7. Calcular costo de envío y envío gratis
    let shippingTotal = '0.00';
    let freeShippingApplied = false;

    if (deliveryMethod === DeliveryMethod.HOME_DELIVERY) {
      if (totalEffective >= CHECKOUT_CONFIG.FREE_SHIPPING_THRESHOLD) {
        shippingTotal = '0.00';
        freeShippingApplied = true;
      } else {
        shippingTotal = CHECKOUT_CONFIG.STANDARD_SHIPPING_FEE.toFixed(2);
        freeShippingApplied = false;
      }
    } else {
      shippingTotal = '0.00';
      freeShippingApplied = totalEffective >= CHECKOUT_CONFIG.FREE_SHIPPING_THRESHOLD;
    }

    const total = totalEffective + Number(shippingTotal);

    return {
      success: true,
      data: {
        subtotal: totalSubtotal.toFixed(2),
        discountTotal: totalDiscount.toFixed(2),
        shippingTotal: shippingTotal,
        total: total.toFixed(2),
        freeShippingApplied,
      },
    };
  }

  /**
   * Operación reutilizable para liberar de forma atómica e idempotente
   * las reservas de stock asociadas a una orden cancelada o expirada.
   * (Puntos 7, 8 y 9 del requerimiento).
   */
  async releaseOrderReservations(
    orderId: string,
    manager?: EntityManager,
  ): Promise<{ releasedCount: number }> {
    const runInTx = async (tx: EntityManager) => {
      // Adquirir y bloquear reservas de la orden en orden determinista por id
      const reservations = await tx
        .createQueryBuilder(InventoryReservation, 'res')
        .setLock('pessimistic_write')
        .where('res.orderId = :orderId', { orderId })
        .orderBy('res.id', 'ASC')
        .getMany();

      if (!reservations || reservations.length === 0) {
        return { releasedCount: 0 };
      }

      let releasedCount = 0;

      for (const res of reservations) {
        if (res.status === ReservationStatus.RELEASED) {
          // Idempotencia: Si la reserva ya fue liberada, retornar éxito sin cambios adicionales
          continue;
        }

        if (res.status === ReservationStatus.CONSUMED) {
          // Si ya fue consumida definitivamente, impedir su liberación
          throw new BadRequestException(
            `La reserva ${res.id} de la orden ${orderId} ya fue consumida y no se puede liberar`,
          );
        }

        if (res.status === ReservationStatus.ACTIVE) {
          // Adquirir bloqueo pesimista sobre el inventario correspondiente
          const inventory = await tx
            .createQueryBuilder(Inventory, 'inv')
            .setLock('pessimistic_write')
            .where('inv.id = :id', { id: res.inventoryId })
            .getOne();

          if (inventory) {
            const currentReserved = Number(inventory.reserved || 0);
            inventory.reserved = Math.max(0, currentReserved - res.quantity);
            await tx.save(Inventory, inventory);
          }

          res.status = ReservationStatus.RELEASED;
          await tx.save(InventoryReservation, res);
          releasedCount++;

          // Registrar movimiento Kardex de liberación
          const movement = tx.create(InventoryMovement, {
            type: MovementType.IN,
            quantity: res.quantity,
            stockBefore: inventory ? Number(inventory.stock) : 0,
            stockAfter: inventory ? Number(inventory.stock) : 0,
            notes: `Liberación idempotente de reserva para orden ${orderId}`,
            referenceId: orderId,
            channel: MovementChannel.ECOMMERCE,
            productId: res.productId,
          });
          await tx.save(InventoryMovement, movement);
        }
      }

      return { releasedCount };
    };

    if (manager) {
      return runInTx(manager);
    }
    return this.orderRepository.manager.transaction(runInTx);
  }

  /**
   * Revisa y libera de forma atómica e idempotente las reservas de órdenes PAY_AT_STORE
   * cuyo plazo de pago (paymentDeadline de 3 días / 72h) haya vencido.
   * (Puntos 7, 8 y 9 del requerimiento).
   */
  async checkAndReleaseExpiredReservations(
    manager?: EntityManager,
  ): Promise<{ cancelledOrdersCount: number }> {
    const runInTx = async (tx: EntityManager) => {
      const now = new Date();

      // Consultar órdenes expiradas no terminales con bloqueo pesimista (Requerimientos 5 y 11)
      const expiredOrders = await tx
        .createQueryBuilder(Order, 'ord')
        .setLock('pessimistic_write')
        .where('ord.paymentDeadline IS NOT NULL')
        .andWhere('ord.paymentDeadline <= :now', { now })
        .andWhere('ord.status NOT IN (:...terminalStatuses)', {
          terminalStatuses: [OrderStatus.CANCELLED, OrderStatus.DELIVERED],
        })
        .getMany();

      let cancelledOrdersCount = 0;

      for (const expiredOrder of expiredOrders) {
        // Re-verificar PaymentStatus dentro de la transacción para evitar ejecuciones concurrentes
        const payment = await tx.findOne(Payment, { where: { orderId: expiredOrder.id } });
        if (payment && payment.status !== PaymentStatus.PENDING) {
          continue;
        }

        // Liberación idempotente de reservas de inventario
        await this.releaseOrderReservations(expiredOrder.id, tx);

        // Actualizar estado de orden a CANCELLED
        const statusBefore = expiredOrder.status;
        expiredOrder.status = OrderStatus.CANCELLED;
        await tx.save(Order, expiredOrder);

        // Actualizar estado de pago a CANCELLED
        if (payment) {
          payment.status = PaymentStatus.CANCELLED;
          await tx.save(Payment, payment);
        } else {
          await tx.update(Payment, { orderId: expiredOrder.id }, { status: PaymentStatus.CANCELLED });
        }

        // Historial obligatorio de cambio de estado (Requerimiento 2 y 6)
        const history = tx.create(OrderStatusHistory, {
          statusBefore,
          statusAfter: OrderStatus.CANCELLED,
          notes: 'Cancelación automática por vencimiento de plazo de pago (paymentDeadline de 3 días)',
          changedById: null,
        });
        history.order = expiredOrder;
        await tx.save(OrderStatusHistory, history);

        cancelledOrdersCount++;
      }

      return { cancelledOrdersCount };
    };

    if (manager) {
      return runInTx(manager);
    }
    return this.orderRepository.manager.transaction(runInTx);
  }
}
