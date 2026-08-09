import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryQueryDto } from './dto/inventory-query.dto';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: Partial<Record<keyof InventoryService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
      findLowStock: jest.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
      findOne: jest.fn().mockResolvedValue({ id: 'inv-uuid-1', productName: 'Prod 1', details: [] }),
      findDetails: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('GET / debe invocar inventoryService.findAll', async () => {
    const query: InventoryQueryDto = { page: 1, limit: 10 };
    await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('GET /low-stock debe invocar inventoryService.findLowStock', async () => {
    await controller.findLowStock(1, 20);
    expect(service.findLowStock).toHaveBeenCalledWith(1, 20);
  });

  it('GET /:id debe invocar inventoryService.findOne', async () => {
    await controller.findOne('inv-uuid-1');
    expect(service.findOne).toHaveBeenCalledWith('inv-uuid-1');
  });

  it('GET /:id/details debe invocar inventoryService.findDetails', async () => {
    await controller.findDetails('inv-uuid-1');
    expect(service.findDetails).toHaveBeenCalledWith('inv-uuid-1');
  });
});
