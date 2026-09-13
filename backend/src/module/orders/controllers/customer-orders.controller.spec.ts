import { Test, TestingModule } from '@nestjs/testing';
import { CustomerOrdersController } from './customer-orders.controller';
import { CustomerOrdersService } from '../services/customer-orders.service';
import { CustomerOrdersQueryDto } from '../dto/customer-orders-query.dto';

describe('CustomerOrdersController', () => {
  let controller: CustomerOrdersController;
  let service: any;

  const mockCustomer = {
    id: 'cust-uuid-123',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    service = {
      findAllByCustomer: jest.fn(),
      findOrdersForCustomer: jest.fn(),
      findOneForCustomer: jest.fn(),
      findOneByOrderNumber: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerOrdersController],
      providers: [
        {
          provide: CustomerOrdersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CustomerOrdersController>(CustomerOrdersController);
  });

  it('debería retornar las órdenes del cliente autenticado con wrapper pasando el DTO de consulta', async () => {
    const mockResult = {
      orders: [{ id: 'ord-1', orderNumber: 'A7K29P4Q' }],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    service.findAllByCustomer.mockResolvedValue(mockResult);

    const queryDto: CustomerOrdersQueryDto = {
      page: 1,
      limit: 10,
      sortOrder: 'DESC',
    };
    const result = await controller.getMyOrders(mockCustomer as any, queryDto);

    expect(result.success).toBe(true);
    expect(result.data.items).toEqual(mockResult.orders);
    expect(service.findAllByCustomer).toHaveBeenCalledWith(
      'cust-uuid-123',
      queryDto,
    );
  });

  it('debería retornar el detalle de la orden del cliente autenticado con wrapper', async () => {
    const mockDetail = { id: 'ord-1', orderNumber: 'A7K29P4Q', total: '95.00' };
    service.findOneByOrderNumber.mockResolvedValue(mockDetail);

    const result = await controller.getMyOrderDetail(
      mockCustomer as any,
      'A7K29P4Q',
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockDetail);
    expect(service.findOneByOrderNumber).toHaveBeenCalledWith(
      'cust-uuid-123',
      'A7K29P4Q',
    );
  });

  it('debería lanzar BadRequestException si el orderNumber es inválido o no cumple 8 caracteres alfanuméricos', async () => {
    await expect(
      controller.getMyOrderDetail(mockCustomer as any, '??$$%%'),
    ).rejects.toThrow();
    await expect(
      controller.getMyOrderDetail(mockCustomer as any, ''),
    ).rejects.toThrow();
    await expect(
      controller.getMyOrderDetail(mockCustomer as any, 'SHORT'),
    ).rejects.toThrow();
    await expect(
      controller.getMyOrderDetail(mockCustomer as any, 'TOOLONGNUMBER'),
    ).rejects.toThrow();
  });

  it('debería propagar NotFoundException cuando la orden no existe', async () => {
    service.findOneByOrderNumber.mockRejectedValue(new Error('ORDER_NOT_FOUND'));

    await expect(
      controller.getMyOrderDetail(mockCustomer as any, 'NONEXIST'),
    ).rejects.toThrow('ORDER_NOT_FOUND');
  });

  it('debería responder con 404 ORDER_NOT_FOUND (anti-enumeración) si la orden pertenece a otro cliente', async () => {
    service.findOneByOrderNumber.mockRejectedValue(new Error('ORDER_NOT_FOUND'));

    await expect(
      controller.getMyOrderDetail(mockCustomer as any, 'OTHERCUS'),
    ).rejects.toThrow('ORDER_NOT_FOUND');
  });
});
