import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

describe('PurchasesController', () => {
  let controller: PurchasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasesController],
      providers: [
        {
          provide: PurchasesService,
          useValue: {
            uploadInvoice: jest.fn(),
            createNuevoProducto: jest.fn(),
            createReabastecimiento: jest.fn(),
            findAll: jest.fn(),
            getRestockPreview: jest.fn(),
            findByInventory: jest.fn(),
            findOne: jest.fn(),
            updatePurchase: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PurchasesController>(PurchasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
