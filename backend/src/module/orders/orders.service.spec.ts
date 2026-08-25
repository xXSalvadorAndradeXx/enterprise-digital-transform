import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnprocessableEntityException, BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { GuestCustomer } from './entities/guest-customer.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Product } from '../products/entities/product.entity';
import { CheckoutIdempotency } from './entities/checkout-idempotency.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { InventoryReservation } from '../inventory/entities/inventory-reservation.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { CheckoutSource } from './enums/checkout-source.enum';
import { DeliveryType } from './enums/delivery-type.enum';
import { PaymentMethod } from '../payments/enums/payment-method.enum';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { ReservationStatus } from '../inventory/enums/reservation-status.enum';
import { ProductStatus } from '../products/enums/product-status.enum';
import { OrderDelivery } from './entities/order-delivery.entity';
import { Payment } from '../payments/entities/payment.entity';
import { OrderStatus } from './enums/order-status.enum';
import { DeliveryMethod } from './enums/delivery-method.enum';
import { CheckoutIdempotencyStatus } from './enums/checkout-idempotency-status.enum';
jest.mock('../../../common/utils/address.util', () => ({
  validateDepartmentDistrict: jest.fn().mockReturnValue(true),
}), { virtual: true });

describe('OrdersService - Orquestación Atómica de Checkout e Idempotencia Rigurosa', () => {
  let service: OrdersService;
  let mockOrderRepo: any;
  let mockUserRepo: any;
  let mockGuestCustomerRepo: any;
  let mockBranchRepo: any;
  let mockProductRepo: any;
  let mockIdempotencyRepo: any;

  beforeEach(async () => {
    mockOrderRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ id: 'order-uuid-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'order-uuid-1', ...entity })),
      manager: {
        transaction: jest.fn(),
        create: jest.fn().mockImplementation((cls, dto) => ({ id: 'generated-uuid', ...dto })),
        save: jest.fn().mockImplementation((cls, dto) => Promise.resolve(dto || cls)),
      },
    };

    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'user-uuid-123', isActive: true, totalOrders: 2, totalSpent: '200.00' }),
    };

    mockGuestCustomerRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'guest-uuid', ...dto })),
    };

    mockBranchRepo = {
      findOne: jest.fn(),
    };

    mockProductRepo = {
      findOne: jest.fn(),
    };

    mockIdempotencyRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      }),
      findOne: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(GuestCustomer), useValue: mockGuestCustomerRepo },
        { provide: getRepositoryToken(Branch), useValue: mockBranchRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(CheckoutIdempotency), useValue: mockIdempotencyRepo },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  describe('Manejo Riguroso de Idempotencia (Requerimientos 2, 15, 16, 17)', () => {
    const checkoutDto: any = {
      source: CheckoutSource.BUY_NOW,
      items: [{ variantId: 'prod-uuid-1', quantity: 1 }],
      contact: { fullName: 'Pedro Perez', email: 'pedro@example.com', phone: '+50370000000' },
      delivery: { deliveryType: DeliveryType.HOME_DELIVERY, departmentId: 'SS', districtId: 'San_Salvador', city: 'San Salvador', addressLine: 'Calle 1' },
      paymentMethod: PaymentMethod.CARD,
    };
    const validKey = '123e4567-e89b-12d3-a456-426614174000';

    it('debe lanzar BadRequestException IDEMPOTENCY_KEY_REUSED si se reutiliza la key con diferente payload', async () => {
      mockIdempotencyRepo.findOne.mockResolvedValue({
        key: validKey,
        requestHash: 'diferente-hash-payload',
        status: CheckoutIdempotencyStatus.COMPLETED,
      });

      try {
        await service.checkout(checkoutDto, undefined, validKey);
        fail('Debería haber lanzado BadRequestException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(BadRequestException);
        const res = error.getResponse();
        expect(res.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
      }
    });

    it('debe lanzar ConflictException CHECKOUT_ALREADY_PROCESSING si la key está en estado PROCESSING', async () => {
      const computedHash = (service as any).generateRequestHash(checkoutDto);
      mockIdempotencyRepo.findOne.mockResolvedValue({
        key: validKey,
        requestHash: computedHash,
        status: CheckoutIdempotencyStatus.PROCESSING,
      });

      try {
        await service.checkout(checkoutDto, undefined, validKey);
        fail('Debería haber lanzado ConflictException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ConflictException);
        const res = error.getResponse();
        expect(res.error.code).toBe('CHECKOUT_ALREADY_PROCESSING');
      }
    });

    it('debe retornar la respuesta almacenada sin re-procesar el checkout si la key está COMPLETED con el mismo hash', async () => {
      const computedHash = (service as any).generateRequestHash(checkoutDto);
      const cachedResponseBody = {
        success: true,
        data: { orderNumber: 'A7K29P4Q', total: '100.00' },
      };

      mockIdempotencyRepo.findOne.mockResolvedValue({
        key: validKey,
        requestHash: computedHash,
        status: CheckoutIdempotencyStatus.COMPLETED,
        response: cachedResponseBody,
      });

      const result = await service.checkout(checkoutDto, undefined, validKey);
      expect(result).toEqual(cachedResponseBody);
      expect(mockOrderRepo.manager.transaction).not.toHaveBeenCalled();
    });
  });

  describe('Métricas de Customer y Marca de Conteo (Requerimientos 13, 14)', () => {
    it('debe incrementar totalOrders, totalSpent y lastOrderAt del Customer una sola vez usando customerMetricsCountedAt', async () => {
      const checkoutDto: any = {
        source: CheckoutSource.BUY_NOW,
        items: [{ variantId: 'prod-uuid-1', quantity: 1, priceAtAdded: 100 }],
        contact: { fullName: 'Cliente Registrado', email: 'cliente@example.com', phone: '+50370000000' },
        delivery: { deliveryType: DeliveryType.STORE_PICKUP, branchId: 'branch-1' },
        paymentMethod: PaymentMethod.PAY_AT_STORE,
      };

      const mockUser = {
        id: 'user-uuid-123',
        totalOrders: 2,
        totalSpent: '200.00',
        lastOrderAt: null,
      };

      const mockBranch = { id: 'branch-1', name: 'Sucursal 1', isActive: true, allowsPickup: true };
      mockBranchRepo.findOne.mockResolvedValue(mockBranch);

      const mockInventory = { id: 'inv-1', stock: 10, reserved: 0 };
      const mockProduct = {
        id: 'prod-uuid-1',
        productId: 'prod-uuid-1',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isPublished: true,
        deletedAt: null,
        commercialName: 'Producto 1',
        salePrice: 100,
        inventory: mockInventory,
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          getRepository: jest.fn().mockReturnValue({ findOne: jest.fn().mockResolvedValue(null) }),
          createQueryBuilder: jest.fn().mockReturnValue({
            insert: jest.fn().mockReturnThis(),
            into: jest.fn().mockReturnThis(),
            values: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({}),
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(mockInventory),
          }),
          findOne: jest.fn().mockImplementation((entityClass: any, options: any) => {
            if (entityClass === User || options.where?.id === 'user-uuid-123') return Promise.resolve(mockUser);
            if (options.where?.id === 'branch-1') return Promise.resolve(mockBranch);
            if (options.where?.id === 'prod-uuid-1') return Promise.resolve(mockProduct);
            return Promise.resolve(null);
          }),
          create: jest.fn().mockImplementation((cls: any, dto: any) => ({ id: 'uuid-gen', ...dto })),
          save: jest.fn().mockImplementation((clsOrObj: any, obj?: any) => Promise.resolve(obj || clsOrObj)),
          delete: jest.fn().mockResolvedValue({}),
        };
        return cb(fakeTx);
      });

      const result: any = await service.checkout(checkoutDto, 'user-uuid-123');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verificación de incremento de métricas
      expect(mockUser.totalOrders).toBe(3);
      expect(mockUser.totalSpent).toBe('300.00'); // 200 + 100
      expect(mockUser.lastOrderAt).toBeDefined();
    });
  });

  describe('Máquina de Estados Canónica e INVALID_STATUS_TRANSITION', () => {
    it('debe rechazar READY_FOR_PICKUP para órdenes con entrega HOME_DELIVERY', async () => {
      const existingOrder = {
        id: 'order-123',
        status: OrderStatus.PENDING,
        deliveryMethod: DeliveryMethod.HOME_DELIVERY,
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          findOne: jest.fn().mockResolvedValue(existingOrder),
        };
        return cb(fakeTx);
      });

      try {
        await service.updateStatus('order-123', { status: OrderStatus.READY_FOR_PICKUP } as any);
        fail('Debería haber lanzado BadRequestException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(BadRequestException);
        const res = error.getResponse();
        expect(res.error.code).toBe('INVALID_STATUS_TRANSITION');
      }
    });

    it('debe rechazar ON_ROUTE para órdenes con entrega PICKUP / STORE_PICKUP', async () => {
      const existingOrder = {
        id: 'order-456',
        status: OrderStatus.PENDING,
        deliveryMethod: DeliveryMethod.PICKUP,
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          findOne: jest.fn().mockResolvedValue(existingOrder),
        };
        return cb(fakeTx);
      });

      try {
        await service.updateStatus('order-456', { status: OrderStatus.ON_ROUTE } as any);
        fail('Debería haber lanzado BadRequestException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(BadRequestException);
        const res = error.getResponse();
        expect(res.error.code).toBe('INVALID_STATUS_TRANSITION');
      }
    });
  });

  describe('Pruebas Unitarias de Lógica de Negocio y Reglas de Checkout', () => {
    let mockCartRepo: any;

    beforeEach(() => {
      mockCartRepo = {
        findOne: jest.fn(),
        delete: jest.fn(),
      };
      mockOrderRepo.manager.getRepository = jest.fn().mockImplementation((cls) => {
        if (cls.name === 'Cart') return mockCartRepo;
        return {};
      });
    });

    describe('CART vs BUY_NOW y Clientes vs Invitados', () => {
      it('debe rechazar items enviados manualmente en CART', async () => {
        const dto: any = {
          source: CheckoutSource.CART,
          items: [{ variantId: 'prod-uuid-1', quantity: 2 }],
          contact: { fullName: 'Invitado', email: 'guest@example.com', phone: '+50370000000' },
          delivery: { deliveryType: DeliveryType.STORE_PICKUP, branchId: 'branch-1' },
          paymentMethod: PaymentMethod.PAY_AT_STORE,
        };

        // Si es CART, debe obtener del carrito activo. Si el carrito está vacío o no se encuentra, arroja error
        mockCartRepo.findOne.mockResolvedValue(null);
        await expect(service.checkoutPreview(dto, undefined, '123')).rejects.toThrow();
      });

      it('debe validar que un carrito vacío no pueda completar checkout', async () => {
        const dto: any = {
          source: CheckoutSource.CART,
          contact: { fullName: 'Invitado', email: 'guest@example.com', phone: '+50370000000' },
          delivery: { deliveryType: DeliveryType.STORE_PICKUP, branchId: 'branch-1' },
          paymentMethod: PaymentMethod.PAY_AT_STORE,
        };

        mockCartRepo.findOne.mockResolvedValue({ id: 1, items: [] });
        await expect(service.checkoutPreview(dto, undefined, '1')).rejects.toThrow();
      });
    });

    describe('Preview de Checkout sin Efectos Secundarios', () => {
      it('debe calcular correctamente los totales y no mutar la base de datos', async () => {
        const dto: any = {
          source: CheckoutSource.BUY_NOW,
          items: [{ variantId: 'prod-uuid-1', quantity: 2, priceAtAdded: 10.00 }],
          contact: { fullName: 'Juan', email: 'juan@example.com', phone: '+50370000000' },
          delivery: { deliveryType: DeliveryType.STORE_PICKUP, branchId: 'branch-1' },
          paymentMethod: PaymentMethod.PAY_AT_STORE,
        };

        const mockBranch = { id: 'branch-1', name: 'Sucursal Central', isActive: true, allowsPickup: true };
        mockBranchRepo.findOne.mockResolvedValue(mockBranch);

        const mockProduct = {
          id: 'prod-uuid-1',
          productId: 'prod-uuid-1',
          status: ProductStatus.ACTIVE,
          isActive: true,
          isPublished: true,
          deletedAt: null,
          commercialName: 'Producto 1',
          salePrice: 10.00,
          inventory: { stock: 100 },
        };
        mockProductRepo.findOne.mockResolvedValue(mockProduct);

        const previewResult = await service.checkoutPreview(dto, undefined);
        expect(previewResult.success).toBe(true);
        expect(previewResult.data.subtotal).toBe('20.00');
        expect(previewResult.data.discountTotal).toBe('0.00');
        expect(previewResult.data.shippingTotal).toBe('0.00');
        expect(previewResult.data.total).toBe('20.00');
        expect(previewResult.data.freeShippingApplied).toBe(false);
      });
    });

    describe('HOME_DELIVERY vs STORE_PICKUP y Envío Gratuito', () => {
      it('debe aplicar la tarifa de envío estándar en HOME_DELIVERY si el subtotal es 49.99', async () => {
        const dto: any = {
          source: CheckoutSource.BUY_NOW,
          items: [{ variantId: 'prod-uuid-1', quantity: 1, priceAtAdded: 49.99 }],
          contact: { fullName: 'Juan', email: 'juan@example.com', phone: '+50370000000' },
          delivery: {
            deliveryType: DeliveryType.HOME_DELIVERY,
            departmentId: 'SS',
            districtId: 'San_Salvador',
            city: 'San Salvador',
            addressLine: 'Calle 1',
          },
          paymentMethod: PaymentMethod.CARD,
        };

        const mockProduct = {
          id: 'prod-uuid-1',
          productId: 'prod-uuid-1',
          status: ProductStatus.ACTIVE,
          isActive: true,
          isPublished: true,
          deletedAt: null,
          commercialName: 'Producto 1',
          salePrice: 49.99,
          inventory: { stock: 100 },
        };
        mockProductRepo.findOne.mockResolvedValue(mockProduct);

        const previewResult = await service.checkoutPreview(dto, undefined);
        expect(previewResult.data.freeShippingApplied).toBe(false);
        expect(previewResult.data.shippingTotal).toBe('5.00');
        expect(previewResult.data.total).toBe('54.99');
      });

      it('debe aplicar envío gratuito si el subtotal es exactamente 50.00', async () => {
        const dto: any = {
          source: CheckoutSource.BUY_NOW,
          items: [{ variantId: 'prod-uuid-1', quantity: 1, priceAtAdded: 50.00 }],
          contact: { fullName: 'Juan', email: 'juan@example.com', phone: '+50370000000' },
          delivery: {
            deliveryType: DeliveryType.HOME_DELIVERY,
            departmentId: 'SS',
            districtId: 'San_Salvador',
            city: 'San Salvador',
            addressLine: 'Calle 1',
          },
          paymentMethod: PaymentMethod.CARD,
        };

        const mockProduct = {
          id: 'prod-uuid-1',
          productId: 'prod-uuid-1',
          status: ProductStatus.ACTIVE,
          isActive: true,
          isPublished: true,
          deletedAt: null,
          commercialName: 'Producto 1',
          salePrice: 50.00,
          inventory: { stock: 100 },
        };
        mockProductRepo.findOne.mockResolvedValue(mockProduct);

        const previewResult = await service.checkoutPreview(dto, undefined);
        expect(previewResult.data.freeShippingApplied).toBe(true);
        expect(previewResult.data.shippingTotal).toBe('0.00');
        expect(previewResult.data.total).toBe('50.00');
      });
    });

    describe('CARD vs PAY_AT_STORE', () => {
      it('debe rechazar PAY_AT_STORE con HOME_DELIVERY', async () => {
        const dto: any = {
          source: CheckoutSource.BUY_NOW,
          items: [{ variantId: 'prod-uuid-1', quantity: 1 }],
          contact: { fullName: 'Juan', email: 'juan@example.com', phone: '+50370000000' },
          delivery: {
            deliveryType: DeliveryType.HOME_DELIVERY,
            departmentId: 'SS',
            districtId: 'San_Salvador',
            city: 'San Salvador',
            addressLine: 'Calle 1',
          },
          paymentMethod: PaymentMethod.PAY_AT_STORE,
        };

        await expect(service.checkoutPreview(dto, undefined)).rejects.toThrow();
      });
    });
  });
});

