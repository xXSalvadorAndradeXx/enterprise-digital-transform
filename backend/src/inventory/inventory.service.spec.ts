import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, DataSource } from 'typeorm';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryDetailRepository } from './repositories/inventory-detail.repository';
import { InventoryDetail } from './entities/inventory-detail.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';

describe('InventoryService — RN-I-003 & updateStock', () => {
  let service: InventoryService;
  let mockManager: Partial<EntityManager>;
  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    mockManager = {
      increment: jest.fn().mockResolvedValue({ affected: 1 } as any),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      save: jest
        .fn()
        .mockImplementation((entityClass, entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: {},
        },
        {
          provide: InventoryDetailRepository,
          useValue: {},
        },
        {
          provide: getRepositoryToken(InventoryMovement),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  describe('RN-I-003: Control de stock insuficiente', () => {
    it('debe rechazar la operación y lanzar ConflictException (HTTP 409) con mensaje "Stock insuficiente para ejecutar esta operación" si delta negativo supera el stock disponible', async () => {
      const mockDetail = {
        id: 'detail-uuid-1',
        stock: 5,
        minStock: 2,
      } as InventoryDetail;

      mockQueryBuilder.getOne.mockResolvedValue(mockDetail);

      // Delta negativo superior al stock disponible (5 + (-10) = -5 < 0)
      const delta = -10;

      await expect(
        service.updateStock(
          'detail-uuid-1',
          delta,
          mockManager as EntityManager,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Stock insuficiente para ejecutar esta operación',
        ),
      );

      // Verificar que el stock NO fue modificado ni persistido
      expect(mockManager.save).not.toHaveBeenCalled();
      expect(mockDetail.stock).toBe(5);
    });

    it('debe aplicar el decremento correctamente y persistir cuando el stock resultante sea mayor o igual a 0', async () => {
      const mockDetail = {
        id: 'detail-uuid-1',
        stock: 10,
        minStock: 2,
      } as InventoryDetail;

      mockQueryBuilder.getOne.mockResolvedValue(mockDetail);

      const delta = -4; // 10 - 4 = 6 >= 0

      await service.updateStock(
        'detail-uuid-1',
        delta,
        mockManager as EntityManager,
      );

      expect(mockDetail.stock).toBe(6);
      expect(mockManager.save).toHaveBeenCalledWith(
        InventoryDetail,
        mockDetail,
      );
    });

    it('debe incrementar el stock cuando delta sea positivo sin lanzar excepciones', async () => {
      const delta = 15;

      await service.updateStock(
        'detail-uuid-1',
        delta,
        mockManager as EntityManager,
      );

      expect(mockManager.increment).toHaveBeenCalledWith(
        InventoryDetail,
        { id: 'detail-uuid-1' },
        'stock',
        15,
      );
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si la variante no existe en decremento', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.updateStock(
          'detail-uuid-non-existent',
          -3,
          mockManager as EntityManager,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'Detalle de inventario con ID detail-uuid-non-existent no encontrado',
        ),
      );

      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });

  describe('RN-I-008: Unicidad del SKU en createInventoryDetail', () => {
    it('debe lanzar ConflictException con mensaje exacto si el SKU ya existe', async () => {
      mockManager.findOne = jest
        .fn()
        .mockResolvedValue({ id: 'detail-existing-1', sku: 'SKU-EXISTING' });

      await expect(
        service.createInventoryDetail(
          'inv-uuid-1',
          {
            sku: 'SKU-EXISTING',
            size: 'M',
            color: '#FFFFFF',
            stock: 10,
            unitCost: 20,
            minStock: 5,
          },
          mockManager as EntityManager,
        ),
      ).rejects.toThrow(
        new ConflictException('El SKU SKU-EXISTING ya está registrado'),
      );
    });

    it('debe persistir el detalle cuando el SKU sea único', async () => {
      mockManager.findOne = jest.fn().mockResolvedValue(null);
      mockManager.create = jest
        .fn()
        .mockImplementation((entityClass, entity) => entity);

      const result = await service.createInventoryDetail(
        'inv-uuid-1',
        {
          sku: 'SKU-NEW',
          size: 'L',
          color: '#000000',
          stock: 15,
          unitCost: 25,
          minStock: 3,
        },
        mockManager as EntityManager,
      );

      expect(mockManager.save).toHaveBeenCalled();
      expect(result.sku).toBe('SKU-NEW');
    });
  });
});
