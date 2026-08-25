import { Test, TestingModule } from '@nestjs/testing';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './enums/order-status.enum';

describe('AdminOrdersController', () => {
  let controller: AdminOrdersController;
  let ordersService: any;

  beforeEach(async () => {
    ordersService = {
      updateStatusByOrderNumber: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminOrdersController],
      providers: [
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();

    controller = module.get<AdminOrdersController>(AdminOrdersController);
  });

  it('debe estar definido el controlador administrativo', () => {
    expect(controller).toBeDefined();
  });

  describe('updateStatus', () => {
    it('debe llamar a ordersService.updateStatusByOrderNumber con el orderNumber, el DTO y el ID de usuario', async () => {
      const updateDto: UpdateOrderStatusDto = {
        status: OrderStatus.READY_FOR_PICKUP,
        notes: 'Orden lista para retiro en tienda',
      } as any;

      const req = { user: { id: 'admin-uuid-123' } };
      const mockResult = { id: 'order-1', orderNumber: 'A7K29P4Q', status: OrderStatus.READY_FOR_PICKUP };

      ordersService.updateStatusByOrderNumber.mockResolvedValue(mockResult);

      const result = await controller.updateStatus('A7K29P4Q', updateDto, req);

      expect(ordersService.updateStatusByOrderNumber).toHaveBeenCalledWith('A7K29P4Q', updateDto, 'admin-uuid-123');
      expect(result).toEqual(mockResult);
    });
  });
});
