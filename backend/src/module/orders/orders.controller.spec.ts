import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CheckoutSource } from './enums/checkout-source.enum';
import { DeliveryType } from './enums/delivery-type.enum';
import { PaymentMethod } from '../payments/enums/payment-method.enum';
import { OrderStatus } from './enums/order-status.enum';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: any;

  beforeEach(async () => {
    ordersService = {
      checkout: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  describe('checkout', () => {
    const checkoutDto: CheckoutDto = {
      source: CheckoutSource.BUY_NOW,
      contact: { fullName: 'Juan Perez', email: 'juan@example.com', phone: '+50370000000' },
      delivery: { deliveryType: DeliveryType.HOME_DELIVERY, departmentId: 'SS', districtId: 'San_Salvador', city: 'San Salvador', addressLine: 'Calle 1' },
      paymentMethod: PaymentMethod.CARD,
    };
    const validIdempotencyKey = '123e4567-e89b-12d3-a456-426614174000';

    it('debe lanzar BadRequestException si falta el header Idempotency-Key', async () => {
      try {
        await controller.checkout(checkoutDto, { user: null }, undefined);
        fail('Debería haber lanzado BadRequestException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(BadRequestException);
        const res = error.getResponse();
        expect(res.code).toBe('MISSING_IDEMPOTENCY_KEY');
      }
    });

    it('debe lanzar BadRequestException si el header Idempotency-Key no es un UUID v4 válido', async () => {
      try {
        await controller.checkout(checkoutDto, { user: null }, 'invalid-uuid-key');
        fail('Debería haber lanzado BadRequestException');
      } catch (error: any) {
        expect(error).toBeInstanceOf(BadRequestException);
        const res = error.getResponse();
        expect(res.code).toBe('INVALID_IDEMPOTENCY_KEY');
      }
    });

    it('debe llamar a ordersService.checkout con los parámetros correctos cuando la idempotency-key es válida', async () => {
      const req = { user: { id: 'user-123' } };
      const mockOrder = { id: 'order-123', orderNumber: 'A1B2C3D4' };
      ordersService.checkout.mockResolvedValue(mockOrder);

      const result = await controller.checkout(checkoutDto, req, validIdempotencyKey);

      expect(ordersService.checkout).toHaveBeenCalledWith(checkoutDto, 'user-123', validIdempotencyKey);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('create', () => {
    it('debe llamar a ordersService.create con CreateOrderDto', async () => {
      const dto: CreateOrderDto = {
        customerEmail: 'juan@example.com',
        customerName: 'Juan Perez',
      } as any;
      const mockOrder = { id: 'order-1' };
      ordersService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(dto);
      expect(ordersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findOne', () => {
    it('debe llamar a ordersService.findOne con el ID provisto', async () => {
      const mockOrder = { id: 'order-99' };
      ordersService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne('order-99');
      expect(ordersService.findOne).toHaveBeenCalledWith('order-99');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateStatus', () => {
    it('debe llamar a ordersService.updateStatus con ID y UpdateOrderStatusDto', async () => {
      const updateDto: UpdateOrderStatusDto = {
        status: OrderStatus.COMPLETED,
        notes: 'Entrega realizada con éxito',
      } as any;
      const mockOrder = { id: 'order-99', status: OrderStatus.COMPLETED };
      ordersService.updateStatus.mockResolvedValue(mockOrder);

      const result = await controller.updateStatus('order-99', updateDto);
      expect(ordersService.updateStatus).toHaveBeenCalledWith('order-99', updateDto);
      expect(result).toEqual(mockOrder);
    });
  });
});
