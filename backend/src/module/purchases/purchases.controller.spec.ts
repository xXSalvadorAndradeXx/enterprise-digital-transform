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
            findAll: jest.fn(),
            findOne: jest.fn(),
            findOneWithHistory: jest.fn(),
            findHistory: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            changeStatus: jest.fn(),
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
