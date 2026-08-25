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

describe('OrdersService - Máquina de Estados Canónica, Expiración y Autorización', () => {
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

  describe('Máquina de Estados Canónica e INVALID_STATUS_TRANSITION (Requerimientos 1, 3, 4, 10)', () => {
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
        expect(res.error.details).toEqual({
          currentStatus: OrderStatus.PENDING,
          requestedStatus: OrderStatus.READY_FOR_PICKUP,
        });
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

    it('debe rechazar cambios de estado desde un estado terminal (DELIVERED o CANCELLED)', async () => {
      const deliveredOrder = {
        id: 'order-789',
        status: OrderStatus.DELIVERED,
        deliveryMethod: DeliveryMethod.HOME_DELIVERY,
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          findOne: jest.fn().mockResolvedValue(deliveredOrder),
        };
        return cb(fakeTx);
      });

      try {
        await service.updateStatus('order-789', { status: OrderStatus.PENDING } as any);
        fail('Debería haber lanzado BadRequestException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(BadRequestException);
        const res = error.getResponse();
        expect(res.error.code).toBe('INVALID_STATUS_TRANSITION');
      }
    });

    it('debe actualizar estado por orderNumber y liberar reservas en cancelación', async () => {
      const existingOrder = {
        id: 'order-uuid-999',
        orderNumber: 'A7K29P4Q',
        status: OrderStatus.PENDING,
        deliveryMethod: DeliveryMethod.PICKUP,
      };

      let statusUpdated = false;

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          findOne: jest.fn().mockResolvedValue(existingOrder),
          createQueryBuilder: jest.fn().mockReturnValue({
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
          }),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
          create: jest.fn().mockImplementation((cls, dto) => dto),
          save: jest.fn().mockImplementation((clsOrObj, obj) => {
            const target = obj || clsOrObj;
            if (target.status === OrderStatus.CANCELLED) statusUpdated = true;
            return Promise.resolve(target);
          }),
        };
        return cb(fakeTx);
      });

      const result = await service.updateStatusByOrderNumber('A7K29P4Q', {
        status: OrderStatus.CANCELLED,
        notes: 'Cancelado por administración',
      } as any);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(statusUpdated).toBe(true);
    });
  });

  describe('checkAndReleaseExpiredReservations - Scheduler y Concurrencia (Requerimientos 5, 7, 8, 11)', () => {
    it('debe liberar reservas y cancelar la orden si el pago continúa PENDING y la fecha venció', async () => {
      const expiredOrder = {
        id: 'expired-order-1',
        orderNumber: 'EXP12345',
        status: OrderStatus.PENDING,
        paymentDeadline: new Date(Date.now() - 5000),
      };

      const mockPayment = {
        id: 'pay-1',
        orderId: 'expired-order-1',
        status: PaymentStatus.PENDING,
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          createQueryBuilder: jest.fn().mockImplementation((entity: any) => {
            if (entity === Order) {
              return {
                setLock: jest.fn().mockReturnThis(),
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
          findOne: jest.fn().mockResolvedValue(mockPayment),
          save: jest.fn().mockImplementation((clsOrObj: any, obj?: any) => Promise.resolve(obj || clsOrObj)),
          create: jest.fn().mockImplementation((cls: any, dto: any) => dto),
        };
        return cb(fakeTx);
      });

      const result = await service.checkAndReleaseExpiredReservations();
      expect(result.cancelledOrdersCount).toBe(1);
      expect(expiredOrder.status).toBe(OrderStatus.CANCELLED);
      expect(mockPayment.status).toBe(PaymentStatus.CANCELLED);
    });

    it('no debe modificar la orden si el pago ya fue completado o no está en estado PENDING (concurrencia)', async () => {
      const expiredOrder = {
        id: 'expired-order-2',
        orderNumber: 'EXP99999',
        status: OrderStatus.PENDING,
        paymentDeadline: new Date(Date.now() - 5000),
      };

      const mockApprovedPayment = {
        id: 'pay-2',
        orderId: 'expired-order-2',
        status: PaymentStatus.APPROVED, // Ya pagado
      };

      mockOrderRepo.manager.transaction.mockImplementation(async (cb: any) => {
        const fakeTx: any = {
          createQueryBuilder: jest.fn().mockImplementation((entity: any) => {
            if (entity === Order) {
              return {
                setLock: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([expiredOrder]),
              };
            }
            return {};
          }),
          findOne: jest.fn().mockResolvedValue(mockApprovedPayment),
        };
        return cb(fakeTx);
      });

      const result = await service.checkAndReleaseExpiredReservations();
      expect(result.cancelledOrdersCount).toBe(0);
      expect(expiredOrder.status).toBe(OrderStatus.PENDING); // Permanece sin cambios
    });
  });

  describe('findOneByOrderNumber - Autorización de Consulta', () => {
    it('debe lanzar ORDER_NOT_FOUND si la orden no existe', async () => {
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

    it('debe conceder acceso al propietario autenticado', async () => {
      const mockOrder = { orderNumber: 'A7K29P4Q', customerId: 'cust-100' };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOneByOrderNumber('A7K29P4Q', { id: 'cust-100' });
      expect(result.orderNumber).toBe('A7K29P4Q');
    });

    it('debe rechazar con ORDER_FORBIDDEN a clientes no propietarios', async () => {
      const mockOrder = { orderNumber: 'A7K29P4Q', customerId: 'cust-100' };
      mockOrderRepo.findOne.mockResolvedValue(mockOrder);

      try {
        await service.findOneByOrderNumber('A7K29P4Q', { id: 'other-cust' });
        fail('Debería haber lanzado ForbiddenException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(ForbiddenException);
        const res = error.getResponse();
        expect(res.error.code).toBe('ORDER_FORBIDDEN');
      }
    });
  });
});
