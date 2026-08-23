import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { SupplierPurchase } from './entities/supplier-purchase.entity';
import { SupplierPurchaseItem } from './entities/supplier-purchase-item.entity';
import { PurchaseStatus } from './enums/purchase-status.enum';

const mockQR = {
  connect: jest.fn().mockResolvedValue(undefined),
  startTransaction: jest.fn().mockResolvedValue(undefined),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
  manager: {
    create: jest.fn().mockImplementation((entityClass, data) => data),
    save: jest.fn().mockImplementation(async (entityClass, data) => ({ id: 'purchase-1', ...data })),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    }),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  },
  query: jest.fn(),
};

const mockDataSource = {
  createQueryRunner: jest.fn(() => mockQR),
};

const mockPurchaseRepo = {
  findOne: jest.fn().mockResolvedValue({
    id: 'purchase-1',
    items: [],
    supplier: { id: 'supplier-1', name: 'Mock Supplier' },
    createdByUser: { id: 'user-1', firstName: 'Admin', lastName: 'ERP' },
  }),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  })),
};

const mockItemRepo = {};

describe('PurchasesService', () => {
  let service: PurchasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: getRepositoryToken(SupplierPurchase), useValue: mockPurchaseRepo },
        { provide: getRepositoryToken(SupplierPurchaseItem), useValue: mockItemRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
    jest.clearAllMocks();
  });

  describe('createNuevoProducto', () => {
    it('crea compra de nuevo producto exitosamente', async () => {
      mockQR.query.mockImplementation(async (query: string, params: any[]) => {
        if (query.includes('FROM suppliers')) {
          return [{ id: 'supplier-1', deleted_at: null }];
        }
        if (query.includes('FROM categories')) {
          return [{ id: 1 }];
        }
        if (query.includes('FROM supplier_purchases')) {
          return []; // no duplicates
        }
        if (query.includes('INSERT INTO inventories')) {
          return [{ id: 'inv-1' }];
        }
        if (query.includes('INSERT INTO inventory_details')) {
          return [{ id: 'detail-1' }];
        }
        return [];
      });

      const dto = {
        supplierId: 'supplier-1',
        purchaseDate: new Date(),
        productName: 'Camisa Test',
        brand: 'Brand Test',
        categoryId: 1,
        variants: [{ size: 'M', color: '#000000', quantity: 10, unitCost: 15.5 }],
      };

      const result = await service.createNuevoProducto(dto as any, 'user-1');
      expect(result).toBeDefined();
      expect(mockQR.commitTransaction).toHaveBeenCalled();
    });

    it('lanza NotFoundException si el proveedor no existe', async () => {
      mockQR.query.mockImplementation(async (query: string) => {
        if (query.includes('FROM suppliers')) {
          return []; // not found
        }
        return [];
      });

      const dto = {
        supplierId: 'bad-supplier',
        purchaseDate: new Date(),
        productName: 'Camisa Test',
        brand: 'Brand Test',
        categoryId: 1,
        variants: [{ size: 'M', color: '#000000', quantity: 10, unitCost: 15.5 }],
      };

      await expect(
        service.createNuevoProducto(dto as any, 'user-1')
      ).rejects.toThrow(NotFoundException);
      expect(mockQR.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('createReabastecimiento', () => {
    it('lanza NotFoundException si el proveedor no existe', async () => {
      mockQR.query.mockImplementation(async (query: string) => {
        if (query.includes('FROM suppliers')) {
          return [];
        }
        return [];
      });

      const dto = {
        supplierId: 'bad-supplier',
        purchaseDate: new Date(),
        inventoryId: 'inv-1',
        existingVariants: [{ inventoryDetailId: 'detail-1', quantity: 5, unitCost: 10 }],
        newVariants: [],
      };

      await expect(
        service.createReabastecimiento(dto as any, 'user-1')
      ).rejects.toThrow(NotFoundException);
    });
  });
});