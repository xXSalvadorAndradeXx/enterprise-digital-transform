import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnprocessableEntityException, BadRequestException, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
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

describe('OrdersService - Módulo Completo de Órdenes y Autorización de Consulta', () => {
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
      findOne: jest.fn(),
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

  describe('generateUniqueOrderNumber - Requerimiento 1', () => {
    it('debe generar un orderNumber público de exactamente 8 caracteres alfanuméricos en mayúsculas', async () => {
      const orderNumber = await (service as any).generateUniqueOrderNumber();
      expect(orderNumber).toBeDefined();
      expect(orderNumber.length).toBe(8);
      expect(orderNumber).toMatch(/^[A-Z0-9]{8}$/);
    });

    it('debe reintentar si se detecta una colisión previa de orderNumber', async () => {
      mockOrderRepo.findOne
        .mockResolvedValueOnce({ id: 'existing-order' })
        .mockResolvedValueOnce(null);

      const orderNumber = await (service as any).generateUniqueOrderNumber();
      expect(orderNumber).toBeDefined();
      expect(orderNumber.length).toBe(8);
      expect(mockOrderRepo.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('findOne', () => {
    it('debe retornar la orden si existe por UUID interno', async () => {
      const mockOrder = { id: 'order-123', orderNumber: 'A1B2C3D4' };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne('order-123');
      expect(result).toEqual(mockOrder);
    });

    it('debe lanzar NotFoundException si la orden por UUID interno no existe', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByOrderNumber - Autorización de Consulta (Requerimientos 4 a 12)', () => {
    it('debe lanzar ORDER_NOT_FOUND si el orderNumber solicitado no existe', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      try {
        await service.findOneByOrderNumber('UNKNOWN8');
        fail('Debería haber lanzado NotFoundException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(NotFoundException);
        const res = error.getResponse();
        expect(res.error.code).toBe('ORDER_NOT_FOUND');
      }
    });

    it('debe permitir acceso al cliente autenticado si es el propietario de la orden (ownership)', async () => {
      const mockOrder = {
        orderNumber: 'A7K29P4Q',
        customerId: 'customer-uuid-100',
        guestOrderAccessTokenHash: null,
      };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const user = { id: 'customer-uuid-100' };
      const result = await service.findOneByOrderNumber('A7K29P4Q', user);

      expect(result).toBeDefined();
      expect(result.orderNumber).toBe('A7K29P4Q');
    });

    it('debe rechazar con ORDER_FORBIDDEN si un cliente autenticado intenta consultar la orden de otro cliente', async () => {
      const mockOrder = {
        orderNumber: 'A7K29P4Q',
        customerId: 'customer-uuid-100',
        guestOrderAccessTokenHash: null,
      };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const user = { id: 'other-customer-uuid' };
      try {
        await service.findOneByOrderNumber('A7K29P4Q', user);
        fail('Debería haber lanzado ForbiddenException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ForbiddenException);
        const res = error.getResponse();
        expect(res.error.code).toBe('ORDER_FORBIDDEN');
      }
    });

    it('debe permitir acceso a un usuario administrativo mediante RBAC', async () => {
      const mockOrder = {
        orderNumber: 'A7K29P4Q',
        customerId: 'customer-uuid-100',
      };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const adminUser = { id: 'admin-uuid', role: 'ADMIN' };
      const result = await service.findOneByOrderNumber('A7K29P4Q', adminUser);

      expect(result).toBeDefined();
      expect(result.orderNumber).toBe('A7K29P4Q');
    });

    it('debe exigir ORDER_ACCESS_TOKEN_REQUIRED si una orden de invitado se consulta sin el header X-Order-Access-Token', async () => {
      const rawToken = 'secret-guest-token-12345';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const mockOrder = {
        orderNumber: 'A7K29P4Q',
        customerId: null,
        guestOrderAccessTokenHash: tokenHash,
      };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      try {
        await service.findOneByOrderNumber('A7K29P4Q', null, undefined);
        fail('Debería haber lanzado UnauthorizedException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        const res = error.getResponse();
        expect(res.error.code).toBe('ORDER_ACCESS_TOKEN_REQUIRED');
      }
    });

    it('debe rechazar con ORDER_FORBIDDEN si el header X-Order-Access-Token enviado no coincide con el hash almacenado', async () => {
      const rawToken = 'secret-guest-token-12345';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const mockOrder = {
        orderNumber: 'A7K29P4Q',
        customerId: null,
        guestOrderAccessTokenHash: tokenHash,
      };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      try {
        await service.findOneByOrderNumber('A7K29P4Q', null, 'wrong-access-token');
        fail('Debería haber lanzado ForbiddenException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ForbiddenException);
        const res = error.getResponse();
        expect(res.error.code).toBe('ORDER_FORBIDDEN');
      }
    });

    it('debe conceder acceso y retornar la orden sanitizada sin el hash si el X-Order-Access-Token es correcto', async () => {
      const rawToken = 'secret-guest-token-12345';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const mockOrder = {
        orderNumber: 'A7K29P4Q',
        customerId: null,
        guestOrderAccessTokenHash: tokenHash,
        status: OrderStatus.NEW,
      };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOneByOrderNumber('A7K29P4Q', null, rawToken);

      expect(result).toBeDefined();
      expect(result.orderNumber).toBe('A7K29P4Q');
      expect((result as any).guestOrderAccessTokenHash).toBeUndefined(); // Sanitizado
    });
  });

  describe('updateStatus', () => {
    it('debe actualizar el estado de la orden y registrar la entrada en el historial', async () => {
      const existingOrder = {
        id: 'order-123',
        status: OrderStatus.NEW,
        deliveryMethod: DeliveryMethod.HOME_DELIVERY,
        statusHistory: [],
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          findOne: jest.fn().mockResolvedValue(existingOrder),
          create: jest.fn().mockImplementation((cls, dto) => dto),
          save: jest.fn().mockImplementation((clsOrObj, obj) => Promise.resolve(obj || clsOrObj)),
        };
        return cb(fakeTx);
      });

      const result = await service.updateStatus('order-123', {
        status: OrderStatus.PENDING,
        notes: 'Confirmando orden',
      } as any);

      expect(result.status).toBe(OrderStatus.PENDING);
    });

    it('debe retornar la orden sin cambios si el nuevo estado es idéntico al actual', async () => {
      const existingOrder = {
        id: 'order-123',
        status: OrderStatus.NEW,
        deliveryMethod: DeliveryMethod.HOME_DELIVERY,
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          findOne: jest.fn().mockResolvedValue(existingOrder),
        };
        return cb(fakeTx);
      });

      const result = await service.updateStatus('order-123', {
        status: OrderStatus.NEW,
      } as any);

      expect(result.status).toBe(OrderStatus.NEW);
    });

    it('debe lanzar BadRequestException ante una transición de estado inválida', async () => {
      const existingOrder = {
        id: 'order-123',
        status: OrderStatus.NEW,
        deliveryMethod: DeliveryMethod.HOME_DELIVERY,
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          findOne: jest.fn().mockResolvedValue(existingOrder),
        };
        return cb(fakeTx);
      });

      await expect(
        service.updateStatus('order-123', { status: OrderStatus.DELIVERED } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Reglas de Validación y Flujos CARD / PAY_AT_STORE', () => {
    it('debe rechazar la combinación PAY_AT_STORE + HOME_DELIVERY', async () => {
      const checkoutDto: any = {
        source: CheckoutSource.BUY_NOW,
        items: [{ variantId: 'prod-uuid-1', quantity: 1, priceAtAdded: 100 }],
        contact: { fullName: 'Juan Perez', email: 'juan@example.com', phone: '+50370000000' },
        delivery: {
          deliveryType: DeliveryType.HOME_DELIVERY,
          departmentId: 'SS',
          districtId: 'San_Salvador',
          city: 'San Salvador',
          addressLine: 'Calle Principal #123',
        },
        paymentMethod: PaymentMethod.PAY_AT_STORE,
      };

      try {
        await service.checkout(checkoutDto);
        fail('Debería haber lanzado BadRequestException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(BadRequestException);
        const res = error.getResponse();
        expect(res.code).toBe('INVALID_PAYMENT_COMBINATION');
      }
    });

    it('debe generar guestOrderAccessToken para pedido invitado y guardar el hash en BD', async () => {
      const checkoutDto: any = {
        source: CheckoutSource.BUY_NOW,
        items: [{ variantId: 'prod-uuid-1', quantity: 1, priceAtAdded: 100 }],
        contact: { fullName: 'Invitado Perez', email: 'invitado@example.com', phone: '+50370000000' },
        delivery: {
          deliveryType: DeliveryType.STORE_PICKUP,
          branchId: 'branch-uuid-1',
        },
        paymentMethod: PaymentMethod.PAY_AT_STORE,
      };

      const mockBranch = { id: 'branch-uuid-1', name: 'Sucursal 1', isActive: true, allowsPickup: true };
      mockBranchRepo.findOne.mockResolvedValue(mockBranch);
      const mockInventory = { id: 'inv-1', stock: 10, reserved: 0 };
      const mockProduct = {
        id: 'prod-uuid-1',
        productId: 'prod-uuid-1',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isPublished: true,
        deletedAt: null,
        commercialName: 'Producto Test',
        salePrice: 100,
        inventory: mockInventory,
      };

      let createdOrder: any = null;

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
            if (options.where?.id === 'branch-uuid-1') return Promise.resolve(mockBranch);
            if (options.where?.id === 'prod-uuid-1') return Promise.resolve(mockProduct);
            return Promise.resolve(null);
          }),
          create: jest.fn().mockImplementation((cls: any, dto: any) => ({ id: 'uuid-gen', ...dto })),
          save: jest.fn().mockImplementation((clsOrObj: any, obj?: any) => {
            const target = obj || clsOrObj;
            if (target && target.orderNumber) createdOrder = target;
            return Promise.resolve({ id: 'saved-id', ...target });
          }),
          delete: jest.fn().mockResolvedValue({}),
        };
        return cb(fakeTx);
      });

      const checkoutResult: any = await service.checkout(checkoutDto); // Invitado sin userId

      expect(checkoutResult).toBeDefined();
      expect(checkoutResult.guestOrderAccessToken).toBeDefined(); // Entregado una sola vez en la respuesta
      expect(typeof checkoutResult.guestOrderAccessToken).toBe('string');
      expect(createdOrder.guestOrderAccessTokenHash).toBeDefined(); // Hash almacenado en la entidad Order
      expect(createdOrder.guestOrderAccessTokenHash.length).toBe(64); // SHA-256 hex length
    });
  });

  describe('checkAndReleaseExpiredReservations - Liberación por Vencimiento de paymentDeadline', () => {
    it('debe detectar órdenes PAY_AT_STORE expiradas (+3 días) y liberar reservas e inhabilitar orden', async () => {
      const expiredOrder = {
        id: 'expired-order-uuid',
        orderNumber: 'EXP12345',
        status: OrderStatus.NEW,
        paymentDeadline: new Date(Date.now() - 1000),
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          createQueryBuilder: jest.fn().mockImplementation((entity: any) => {
            if (entity === Order) {
              return {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([expiredOrder]),
              };
            }
            if (entity === InventoryReservation) {
              return {
                setLock: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
              };
            }
            return {};
          }),
          save: jest.fn().mockImplementation((clsOrObj: any, obj?: any) => Promise.resolve(obj || clsOrObj)),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
          create: jest.fn().mockImplementation((cls: any, dto: any) => dto),
        };
        return cb(fakeTx);
      });

      const result = await service.checkAndReleaseExpiredReservations();
      expect(result.cancelledOrdersCount).toBe(1);
      expect(expiredOrder.status).toBe(OrderStatus.CANCELLED);
    });
  });
});
