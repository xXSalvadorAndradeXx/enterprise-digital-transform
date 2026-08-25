import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnprocessableEntityException, BadRequestException } from '@nestjs/common';
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
import { ReservationStatus } from '../inventory/enums/reservation-status.enum';
import { ProductStatus } from '../products/enums/product-status.enum';

describe('OrdersService - Bloqueos Pesimistas y Gestión de Inventarios', () => {
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

  describe('checkout - Bloqueos Pesimistas y Revalidación de Stock', () => {
    it('debe abortar la transacción y lanzar STOCK_INSUFFICIENT si una variante no tiene suficiente disponible', async () => {
      const checkoutDto: any = {
        source: CheckoutSource.BUY_NOW,
        items: [
          { variantId: 'prod-uuid-1', quantity: 3, priceAtAdded: 100 },
          { variantId: 'prod-uuid-2', quantity: 1, priceAtAdded: 50 },
        ],
        contact: { fullName: 'Juan Perez', email: 'juan@example.com', phone: '+50370000000' },
        delivery: {
          deliveryType: DeliveryType.HOME_DELIVERY,
          departmentId: 'SS',
          districtId: 'San_Salvador',
          city: 'San Salvador',
          addressLine: 'Calle Principal #123',
        },
        paymentMethod: PaymentMethod.CARD,
      };

      const mockProduct1 = {
        id: 'prod-uuid-1',
        productId: 'prod-uuid-1',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isPublished: true,
        deletedAt: null,
        salePrice: 100,
        commercialName: 'Producto 1',
        inventory: { id: 'inv-1', stock: 1, reserved: 0 },
      };

      const mockProduct2 = {
        id: 'prod-uuid-2',
        productId: 'prod-uuid-2',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isPublished: true,
        deletedAt: null,
        salePrice: 50,
        commercialName: 'Producto 2',
        inventory: { id: 'inv-2', stock: 5, reserved: 0 },
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          createQueryBuilder: jest.fn().mockImplementation(() => {
            let targetVariantId: string | null = null;
            return {
              insert: jest.fn().mockReturnThis(),
              into: jest.fn().mockReturnThis(),
              values: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({}),
              setLock: jest.fn().mockReturnThis(),
              where: jest.fn().mockImplementation((clause: string, params: any) => {
                if (params?.variantId) targetVariantId = params.variantId;
                return fakeTx.createQueryBuilder();
              }),
              getOne: jest.fn().mockImplementation(async () => {
                if (targetVariantId === 'prod-uuid-2') return mockProduct2.inventory;
                return mockProduct1.inventory;
              }),
            };
          }),
          findOne: jest.fn().mockImplementation((entityClass: any, options: any) => {
            if (options.where?.id === 'prod-uuid-1') return Promise.resolve(mockProduct1);
            if (options.where?.id === 'prod-uuid-2') return Promise.resolve(mockProduct2);
            return Promise.resolve(null);
          }),
          create: jest.fn().mockImplementation((cls: any, dto: any) => ({ ...dto, id: 'item-uuid' })),
          save: jest.fn().mockImplementation((cls: any, entity: any) => Promise.resolve(entity || cls)),
          delete: jest.fn().mockResolvedValue({}),
        };
        return cb(fakeTx);
      });

      try {
        await service.checkout(checkoutDto);
        fail('Debería haber lanzado UnprocessableEntityException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(UnprocessableEntityException);
        const res = error.getResponse();
        expect(res.error.code).toBe('STOCK_INSUFFICIENT');
        expect(res.error.details).toEqual([
          {
            variantId: 'prod-uuid-1',
            requestedQuantity: 3,
            availableStock: 1,
          },
        ]);
      }
    });

    it('debe reservar stock en PAY_AT_STORE incrementando reserved y creando InventoryReservation', async () => {
      const checkoutDto: any = {
        source: CheckoutSource.BUY_NOW,
        items: [{ variantId: 'prod-uuid-1', quantity: 2, priceAtAdded: 100 }],
        contact: { fullName: 'Maria Lopez', email: 'maria@example.com', phone: '+50371111111' },
        delivery: {
          deliveryType: DeliveryType.STORE_PICKUP,
          branchId: 'branch-uuid-1',
        },
        paymentMethod: PaymentMethod.PAY_AT_STORE,
      };

      const mockBranch = {
        id: 'branch-uuid-1',
        name: 'Sucursal Central',
        isActive: true,
        allowsPickup: true,
      };
      mockBranchRepo.findOne.mockResolvedValue(mockBranch);

      const mockInventory = { id: 'inv-1', stock: 10, reserved: 1 };
      const mockProduct = {
        id: 'prod-uuid-1',
        productId: 'prod-uuid-1',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isPublished: true,
        deletedAt: null,
        salePrice: 100,
        commercialName: 'Producto 1',
        inventory: mockInventory,
      };

      let reservationCreated: any = null;

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
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
          create: jest.fn().mockImplementation((cls: any, dto: any) => {
            if (cls === InventoryReservation) {
              reservationCreated = dto;
            }
            return { id: 'uuid-gen', ...dto };
          }),
          save: jest.fn().mockImplementation((clsOrObj: any, obj?: any) => {
            const target = obj || clsOrObj;
            return Promise.resolve({ id: 'saved-id', ...target });
          }),
          delete: jest.fn().mockResolvedValue({}),
        };
        return cb(fakeTx);
      });

      const orderResult = await service.checkout(checkoutDto);
      expect(orderResult).toBeDefined();
      expect(mockInventory.reserved).toBe(3); // 1 previo + 2 nuevos
      expect(reservationCreated).toBeDefined();
      expect(reservationCreated.status).toBe(ReservationStatus.ACTIVE);
      expect(reservationCreated.quantity).toBe(2);
    });
  });

  describe('releaseOrderReservations - Liberación Idempotente de Reservas', () => {
    it('debe liberar de forma atómica e idempotente las reservas ACTIVE', async () => {
      const orderId = 'order-uuid-99';

      const activeReservation = {
        id: 'res-1',
        orderId,
        inventoryId: 'inv-1',
        productId: 'prod-1',
        quantity: 2,
        status: ReservationStatus.ACTIVE,
      };

      const mockInventory = {
        id: 'inv-1',
        stock: 10,
        reserved: 2,
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          createQueryBuilder: jest.fn().mockImplementation((entity: any) => {
            if (entity === InventoryReservation) {
              return {
                setLock: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([activeReservation]),
              };
            }
            if (entity === Inventory) {
              return {
                setLock: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(mockInventory),
              };
            }
            return {};
          }),
          save: jest.fn().mockImplementation((clsOrObj: any, obj?: any) => {
            const target = obj || clsOrObj;
            return Promise.resolve(target);
          }),
          create: jest.fn().mockImplementation((cls: any, dto: any) => dto),
        };
        return cb(fakeTx);
      });

      const result = await service.releaseOrderReservations(orderId);
      expect(result.releasedCount).toBe(1);
      expect(mockInventory.reserved).toBe(0); // 2 - 2
      expect(activeReservation.status).toBe(ReservationStatus.RELEASED);

      // Segundo intento: Idempotencia (reserva ya RELEASED)
      activeReservation.status = ReservationStatus.RELEASED;
      const secondResult = await service.releaseOrderReservations(orderId);
      expect(secondResult.releasedCount).toBe(0);
      expect(mockInventory.reserved).toBe(0); // No cambia nuevamente
    });
  });
});
