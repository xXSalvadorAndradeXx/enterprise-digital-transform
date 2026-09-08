import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { InventoryService } from '../inventory.service';
import { InventoryRepository } from '../repositories/inventory.repository';
import { InventoryDetailRepository } from '../repositories/inventory-detail.repository';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { Product } from '../../products/entities/product.entity';
import { InventoryStatus } from '../enums/inventory-status.enum';
import { StockStatus } from '../enums/stock-status.enum';
import { MovementType } from '../enums/movement-type.enum';
import { Inventory } from '../entities/inventory.entity';
import { InventoryDetail } from '../entities/inventory-detail.entity';
import { calculateStockStatus } from '../helpers/stock.helper';
import { CreateInventoryInternalDto } from '../dto/internal/create-inventory-internal.dto';

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepository: any;
  let inventoryDetailRepository: any;
  let movementRepo: any;
  let productRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    // Mocks de repositorios con métodos jest.fn()
    inventoryRepository = {
      findAllPaginated: jest.fn(),
      findOneWithDetails: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    inventoryDetailRepository = {
      findByInventoryId: jest.fn(),
      findLowStock: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    movementRepo = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    productRepo = {
      findOne: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
      createEntityManager: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: inventoryRepository,
        },
        {
          provide: InventoryDetailRepository,
          useValue: inventoryDetailRepository,
        },
        {
          provide: getRepositoryToken(InventoryMovement),
          useValue: movementRepo,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('debe estar definido e inicializado correctamente', () => {
    expect(service).toBeDefined();
    expect(inventoryRepository).toBeDefined();
    expect(inventoryDetailRepository).toBeDefined();
  });

  describe('findAll', () => {
    const mockInventory: any = {
      id: 'inv-uuid-1',
      productName: 'Zapato Deportivo',
      brand: 'Nike',
      mainImageUrl: 'https://images.com/zapato.jpg',
      status: InventoryStatus.ACTIVE,
      totalStock: 50,
      totalVariants: 2,
      totalInventoryCost: 475.5,
      createdAt: new Date('2026-08-08T00:00:00.000Z'),
      category: { id: 1, nombre: 'Calzado' },
      supplier: { id: 'sup-uuid-1', name: 'Nike Corp' },
    };

    it('debe recibir un query vacío y retornar data, total, page, limit, totalPages con valores por defecto', async () => {
      inventoryRepository.findAllPaginated!.mockResolvedValue([
        [mockInventory],
        1,
      ]);

      const result = await service.findAll({});

      expect(inventoryRepository.findAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('inv-uuid-1');
      expect(result.data[0].productName).toBe('Zapato Deportivo');
      expect(result.data[0].totalInventoryCost).toBe(475.5);
      expect(result.data[0].category).toEqual({ id: 1, name: 'Calzado' });
      expect(result.data[0].supplier).toEqual({
        id: 'sup-uuid-1',
        name: 'Nike Corp',
      });
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('debe enviar correctamente el filtro status = LOW_STOCK al repositorio', async () => {
      inventoryRepository.findAllPaginated!.mockResolvedValue([[], 0]);

      await service.findAll({ status: InventoryStatus.LOW_STOCK });

      expect(inventoryRepository.findAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InventoryStatus.LOW_STOCK,
        }),
      );
    });

    it('debe enviar correctamente el parámetro search = "zapato" al repositorio', async () => {
      inventoryRepository.findAllPaginated!.mockResolvedValue([
        [mockInventory],
        1,
      ]);

      await service.findAll({ search: 'zapato' });

      expect(inventoryRepository.findAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'zapato',
        }),
      );
    });

    it('debe enviar simultáneamente los filtros supplierId y categoryId al repositorio', async () => {
      inventoryRepository.findAllPaginated!.mockResolvedValue([
        [mockInventory],
        1,
      ]);

      await service.findAll({ supplierId: 'sup-uuid-1', categoryId: 3 });

      expect(inventoryRepository.findAllPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: 'sup-uuid-1',
          categoryId: 3,
        }),
      );
    });

    it('debe lanzar InternalServerErrorException si el repositorio falla', async () => {
      inventoryRepository.findAllPaginated!.mockRejectedValue(
        new Error('DB Connection error'),
      );

      await expect(service.findAll({})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar el inventario con detalles y stockStatus calculado correctamente para un ID existente', async () => {
      const mockInventoryWithDetails: any = {
        id: 'inv-uuid-1',
        productName: 'Camisa Formal',
        brand: 'Zara',
        mainImageUrl: 'https://images.com/camisa.jpg',
        status: InventoryStatus.ACTIVE,
        createdAt: new Date('2026-08-08T00:00:00.000Z'),
        category: { id: 2, nombre: 'Ropa' },
        supplier: { id: 'sup-uuid-2', name: 'Zara Inditex' },
        details: [
          {
            id: 'detail-1',
            sku: 'ZARA-CAM-S',
            size: 'S',
            color: '#FFFFFF',
            stock: 30,
            unitCost: 15.5,
            minStock: 10,
          },
          {
            id: 'detail-2',
            sku: 'ZARA-CAM-M',
            size: 'M',
            color: '#000000',
            stock: 5,
            unitCost: 15.5,
            minStock: 10,
          },
        ],
      };

      inventoryRepository.findOneWithDetails.mockResolvedValue(
        mockInventoryWithDetails,
      );

      const result = await service.findOne('inv-uuid-1');

      expect(inventoryRepository.findOneWithDetails).toHaveBeenCalledWith(
        'inv-uuid-1',
      );
      expect(result.id).toBe('inv-uuid-1');
      expect(result.productName).toBe('Camisa Formal');
      expect(result.category).toEqual({ id: 2, name: 'Ropa' });
      expect(result.supplier).toEqual({
        id: 'sup-uuid-2',
        name: 'Zara Inditex',
      });
      expect(result.totalStock).toBe(35);
      expect(result.totalVariants).toBe(2);
      expect(result.details).toHaveLength(2);
      expect(result.details[0].stockStatus).toBe(StockStatus.ALTO); // 30 > 10 * 2
      expect(result.details[1].stockStatus).toBe(StockStatus.BAJO); // 5 <= 10
    });

    it('debe lanzar NotFoundException si el inventario no existe', async () => {
      inventoryRepository.findOneWithDetails.mockResolvedValue(null);

      await expect(service.findOne('inv-uuid-non-existent')).rejects.toThrow(
        new NotFoundException(
          'Inventario con ID inv-uuid-non-existent no encontrado',
        ),
      );
    });
  });

  describe('findDetails', () => {
    it('debe retornar variantes con stockStatus para un inventario existente', async () => {
      inventoryRepository.findOne.mockResolvedValue({ id: 'inv-uuid-1' });
      inventoryDetailRepository.findByInventoryId.mockResolvedValue([
        {
          id: 'detail-1',
          sku: 'SKU-1',
          size: 'M',
          color: '#FFFFFF',
          stock: 15,
          unitCost: '10.00',
          minStock: 5,
        },
      ]);

      const result = await service.findDetails('inv-uuid-1');

      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe('SKU-1');
      expect(result[0].stockStatus).toBe(StockStatus.ALTO);
    });

    it('debe lanzar NotFoundException si el inventario no existe', async () => {
      inventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findDetails('inv-uuid-none')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('calculateStockStatus', () => {
    it('debe retornar StockStatus.BAJO cuando stock <= minStock', () => {
      expect(calculateStockStatus(5, 10)).toBe(StockStatus.BAJO);
      expect(calculateStockStatus(10, 10)).toBe(StockStatus.BAJO);
      expect(calculateStockStatus(0, 5)).toBe(StockStatus.BAJO);
    });

    it('debe retornar StockStatus.MEDIO cuando stock > minStock y stock <= minStock * 2', () => {
      expect(calculateStockStatus(11, 10)).toBe(StockStatus.MEDIO);
      expect(calculateStockStatus(15, 10)).toBe(StockStatus.MEDIO);
      expect(calculateStockStatus(20, 10)).toBe(StockStatus.MEDIO);
    });

    it('debe retornar StockStatus.ALTO cuando stock > minStock * 2', () => {
      expect(calculateStockStatus(21, 10)).toBe(StockStatus.ALTO);
      expect(calculateStockStatus(100, 10)).toBe(StockStatus.ALTO);
    });

    it('debe retornar StockStatus.BAJO cuando minStock = 0 y stock = 0', () => {
      expect(calculateStockStatus(0, 0)).toBe(StockStatus.BAJO);
    });

    it('debe retornar StockStatus.ALTO cuando minStock = 0 y stock > 0', () => {
      expect(calculateStockStatus(1, 0)).toBe(StockStatus.ALTO);
      expect(calculateStockStatus(50, 0)).toBe(StockStatus.ALTO);
    });
  });

  describe('findLowStock', () => {
    it('debe procesar únicamente los resultados de variantes con min_stock > 0 retornados por el repositorio', async () => {
      const mockLowStockDetails: any[] = [
        {
          id: 'detail-low-1',
          sku: 'SHIRT-BLK-S',
          size: 'S',
          color: '#000000',
          stock: 3,
          unitCost: 20,
          minStock: 10,
          inventory: { productName: 'Camisa Polo' },
        },
      ];

      inventoryDetailRepository.findLowStock.mockResolvedValue([
        mockLowStockDetails,
        1,
      ]);

      const result = await service.findLowStock(1, 10);

      expect(inventoryDetailRepository.findLowStock).toHaveBeenCalledWith(
        1,
        10,
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].minStock).toBeGreaterThan(0);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('debe incluir correctamente el inventoryName obtenido del inventario padre', async () => {
      const mockLowStockDetails: any[] = [
        {
          id: 'detail-low-1',
          sku: 'PANTS-BLU-32',
          size: '32',
          color: '#0000FF',
          stock: 2,
          unitCost: 35,
          minStock: 5,
          inventory: { productName: 'Pantalón Mezclilla' },
        },
      ];

      inventoryDetailRepository.findLowStock.mockResolvedValue([
        mockLowStockDetails,
        1,
      ]);

      const result = await service.findLowStock();

      expect(result.data[0].inventoryName).toBe('Pantalón Mezclilla');
    });

    it('debe calcular stockStatus correctamente para cada variante retornada', async () => {
      const mockLowStockDetails: any[] = [
        {
          id: 'detail-low-1',
          sku: 'SOCK-WHT-U',
          size: 'U',
          color: '#FFFFFF',
          stock: 4,
          unitCost: 5,
          minStock: 10,
          inventory: { productName: 'Calcetas Deportivas' },
        },
      ];

      inventoryDetailRepository.findLowStock.mockResolvedValue([
        mockLowStockDetails,
        1,
      ]);

      const result = await service.findLowStock(1, 20);

      expect(result.data[0].stockStatus).toBe(StockStatus.BAJO);
    });
  });

  describe('updateStock', () => {
    let mockManager: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
      mockQueryBuilder = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };

      mockManager = {
        increment: jest.fn().mockResolvedValue({}),
        save: jest.fn().mockResolvedValue({}),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({ id: 'inv-1', stock: 10, status: 'ACTIVE' }),
      };
    });

    it('debe lanzar ConflictException con HTTP 409 si un delta negativo supera el stock disponible', async () => {
      const mockDetail: any = {
        id: 'detail-uuid-1',
        stock: 5,
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockDetail);

      const delta = -10; // Resultaría en -5 < 0

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

      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('debe incrementar correctamente el stock cuando el delta sea positivo', async () => {
      const delta = 20;

      await service.updateStock(
        'detail-uuid-1',
        delta,
        mockManager as EntityManager,
      );

      expect(mockManager.increment).toHaveBeenCalledWith(
        InventoryDetail,
        { id: 'detail-uuid-1' },
        'stock',
        20,
      );
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('no debe permitir que el stock resultante sea negativo', async () => {
      const mockDetail: any = {
        id: 'detail-uuid-1',
        stock: 3,
      };
      mockQueryBuilder.getOne.mockResolvedValue(mockDetail);

      // Intento que dejaría stock en -1
      await expect(
        service.updateStock('detail-uuid-1', -4, mockManager as EntityManager),
      ).rejects.toThrow(ConflictException);

      expect(mockManager.save).not.toHaveBeenCalled();

      // Intento válido que deja stock exactamente en 0
      await service.updateStock(
        'detail-uuid-1',
        -3,
        mockManager as EntityManager,
      );

      expect(mockDetail.stock).toBe(0);
      expect(mockManager.save).toHaveBeenCalledWith(
        InventoryDetail,
        mockDetail,
      );
    });

    it('debe lanzar NotFoundException si el detalle a decrementar no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.updateStock(
          'detail-uuid-none',
          -5,
          mockManager as EntityManager,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createInventory', () => {
    let mockManager: any;

    beforeEach(() => {
      mockManager = {
        create: jest.fn().mockImplementation((entityClass, data) => data),
        save: jest.fn().mockImplementation(async (entityClass, data) => ({
          id: 'inv-created-1',
          ...data,
        })),
      };
    });

    it('debe crear un inventario correctamente', async () => {
      const dto = {
        productName: 'Producto Test',
        brand: 'Marca Test',
        supplierId: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
        purchaseId: 'b1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8e',
        categoryId: 1,
      };

      const result = await service.createInventory(
        dto,
        mockManager as EntityManager,
      );

      expect(mockManager.create).toHaveBeenCalledWith(Inventory, dto);
      expect(mockManager.save).toHaveBeenCalled();
      expect(result.productName).toBe('Producto Test');
    });

    it('debe lanzar BadRequestException si purchaseId no es un UUID válido', async () => {
      const dto: CreateInventoryInternalDto = {
        productName: 'Producto Test',
        brand: 'Marca Test',
        purchaseId: 'invalid-uuid',
      };

      await expect(
        service.createInventory(dto, mockManager as EntityManager),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si supplierId no es un UUID válido', async () => {
      const dto: CreateInventoryInternalDto = {
        productName: 'Producto Test',
        brand: 'Marca Test',
        supplierId: 'invalid-uuid',
      };

      await expect(
        service.createInventory(dto, mockManager as EntityManager),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createInventoryDetail', () => {
    let mockManager: any;

    beforeEach(() => {
      mockManager = {
        findOne: jest.fn(),
        create: jest.fn().mockImplementation((entityClass, data) => data),
        save: jest.fn(),
      };
    });

    it('debe lanzar ConflictException si el SKU ya existe y no crear el nuevo detalle', async () => {
      const existingSkuDetail = {
        id: 'detail-existing-1',
        sku: 'SKU-DUPLICATED-123',
      };
      mockManager.findOne.mockResolvedValue(existingSkuDetail);

      const dto = {
        sku: 'SKU-DUPLICATED-123',
        size: 'M',
        color: '#000000',
        stock: 10,
        unitCost: 15,
        minStock: 2,
      };

      await expect(
        service.createInventoryDetail(
          'inv-uuid-1',
          dto,
          mockManager as EntityManager,
        ),
      ).rejects.toThrow(
        new ConflictException('El SKU SKU-DUPLICATED-123 ya está registrado'),
      );

      expect(mockManager.findOne).toHaveBeenCalledWith(InventoryDetail, {
        where: { sku: 'SKU-DUPLICATED-123' },
      });
      expect(mockManager.create).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si purchaseItemId no es un UUID válido', async () => {
      const dto = {
        sku: 'SKU-NEW-UUID',
        size: 'M',
        color: '#000000',
        stock: 10,
        unitCost: 15,
        minStock: 2,
        purchaseItemId: 'invalid-uuid',
      };

      await expect(
        service.createInventoryDetail(
          'inv-uuid-1',
          dto,
          mockManager as EntityManager,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe persistir el detalle correctamente cuando el SKU no esté duplicado', async () => {
      mockManager.findOne.mockResolvedValue(null);
      mockManager.save.mockImplementation(async (entityClass, data) => ({
        id: 'detail-new-1',
        ...data,
      }));

      const dto = {
        sku: 'SKU-UNIQUE-456',
        size: 'L',
        color: '#FFFFFF',
        stock: 25,
        unitCost: 30,
        minStock: 5,
      };

      const result = await service.createInventoryDetail(
        'inv-uuid-1',
        dto,
        mockManager as EntityManager,
      );

      expect(mockManager.findOne).toHaveBeenCalledWith(InventoryDetail, {
        where: { sku: 'SKU-UNIQUE-456' },
      });
      expect(mockManager.create).toHaveBeenCalledWith(InventoryDetail, {
        ...dto,
        inventoryId: 'inv-uuid-1',
      });
      expect(mockManager.save).toHaveBeenCalled();
      expect(result.id).toBe('detail-new-1');
      expect(result.sku).toBe('SKU-UNIQUE-456');
    });
  });

  describe('Métodos de Movimientos y Ajustes', () => {
    it('findByProduct debe retornar el inventario o lanzar NotFoundException', async () => {
      inventoryRepository.findOne.mockResolvedValueOnce({
        id: 'inv-p1',
        productId: 'p1',
      });
      const result = await service.findByProduct('p1');
      expect(result.id).toBe('inv-p1');

      inventoryRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.findByProduct('p2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('initForProduct debe retornar existente o crear uno nuevo', async () => {
      inventoryRepository.findOne.mockResolvedValueOnce({
        id: 'inv-exist',
        stock: 10,
      });
      const existing = await service.initForProduct('p1');
      expect(existing.id).toBe('inv-exist');

      inventoryRepository.findOne.mockResolvedValueOnce(null);
      inventoryRepository.create.mockReturnValue({ productId: 'p2', stock: 0 });
      inventoryRepository.save.mockResolvedValue({
        id: 'inv-new',
        productId: 'p2',
        stock: 0,
      });
      const created = await service.initForProduct('p2');
      expect(created.id).toBe('inv-new');
    });

    it('findMovements debe consultar con filtros y retornar paginación', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 'mov-1',
              createdAt: new Date(),
              inventoryDetail: {
                id: 'detail-1',
                sku: 'CAMISA-NEGRA-M',
                size: 'M',
                color: '#000000',
              },
            },
          ],
          1,
        ]),
      };
      movementRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findMovements({
        search: 'Laptop',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
        channel: 'TIENDA_FISICA',
        responsibleUserId: 'user-uuid-1',
        productId: 'prod-1',
        inventoryDetailId: 'detail-1',
        type: MovementType.IN,
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].inventoryDetail).toEqual({
        id: 'detail-1',
        sku: 'CAMISA-NEGRA-M',
        size: 'M',
        color: '#000000',
      });
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(product.commercialName ILIKE :search OR inventory.productName ILIKE :search)',
        { search: '%Laptop%' },
      );
      expect(mockQb.andWhere).toHaveBeenCalledWith('m.channel = :channel', {
        channel: 'TIENDA_FISICA',
      });
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'm.createdById = :responsibleUserId',
        { responsibleUserId: 'user-uuid-1' },
      );
      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'm.inventoryDetailId = :inventoryDetailId',
        { inventoryDetailId: 'detail-1' },
      );

      // findMovements sin parámetros para cubrir branches por defecto
      const defaultResult = await service.findMovements({});
      expect(defaultResult.meta.page).toBe(1);
      expect(defaultResult.meta.limit).toBe(20);
    });

    it('findMovements debe lanzar BadRequestException si dateFrom es posterior a dateTo', async () => {
      await expect(
        service.findMovements({
          dateFrom: '2026-12-31',
          dateTo: '2026-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('findMovements debe retornar 200 con data: [] cuando no hay resultados', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      movementRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findMovements({ search: 'Inexistente' });
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('findOne debe manejar inventarios con relaciones nulas correctamente', async () => {
      const bareInventory: any = {
        id: 'inv-bare',
        productName: 'Producto Sin Relaciones',
        brand: 'Generica',
        mainImageUrl: null,
        status: InventoryStatus.ACTIVE,
        createdAt: null,
        category: null,
        supplier: null,
        details: null,
      };

      inventoryRepository.findOneWithDetails.mockResolvedValue(bareInventory);

      const result = await service.findOne('inv-bare');

      expect(result.category).toBeNull();
      expect(result.supplier).toBeNull();
      expect(result.createdAt).toBeNull();
      expect(result.totalStock).toBe(0);
      expect(result.totalVariants).toBe(0);
      expect(result.details).toEqual([]);
    });

    it('adjust debe actualizar stock y registrar movimiento (ajuste directo de producto)', async () => {
      const mockInventory = { id: 'inv-1', stock: 10 };
      const mockQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInventory),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };

      const mockTxManager = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
        save: jest.fn().mockImplementation(async (entityClass, data) => data),
        create: jest.fn().mockImplementation((entityClass, data) => data),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(mockInventory),
      };

      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb(mockTxManager),
      );

      const result = await service.adjust(
        {
          productId: 'prod-1',
          quantity: 5,
          type: MovementType.IN,
        },
        'user-uuid-1',
      );

      expect(mockInventory.stock).toBe(15);
      expect(result.type).toBe(MovementType.IN);
    });

    it('adjust debe actualizar stock de variante y recalcular stock del inventario principal', async () => {
      const mockInventory = { id: 'inv-1', stock: 10 };
      const mockDetail = { id: 'detail-1', sku: 'SKU-1', stock: 4, inventoryId: 'inv-1' };
      const mockQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(mockInventory) // para inventario
          .mockResolvedValueOnce(mockDetail), // para variante
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      };

      const mockTxManager = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
        save: jest.fn().mockImplementation(async (entityClass, data) => data),
        create: jest.fn().mockImplementation((entityClass, data) => data),
        find: jest.fn().mockResolvedValue([mockDetail]),
        findOne: jest.fn().mockImplementation(async (entityClass, options) => mockInventory),
      };

      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb(mockTxManager),
      );

      const result = await service.adjust(
        {
          productId: 'prod-1',
          inventoryDetailId: 'detail-1',
          quantity: 5,
          type: MovementType.IN,
        },
        'user-uuid-1',
      );

      expect(mockDetail.stock).toBe(9);
      expect(mockInventory.stock).toBe(9); // Recalculado: sum of details (detail.stock = 9)
      expect(result.type).toBe(MovementType.IN);
      expect(result.inventoryDetailId).toBe('detail-1');
    });

    it('adjust debe lanzar BadRequestException si stock final es negativo', async () => {
      const mockInventory = { id: 'inv-1', stock: 2 };
      const mockQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockInventory),
      };

      const mockTxManager = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      };

      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb(mockTxManager),
      );

      await expect(
        service.adjust(
          { productId: 'prod-1', quantity: -5, type: MovementType.OUT },
          'user-uuid-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('adjust debe lanzar NotFoundException si inventario no existe', async () => {
      const mockQb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      const mockTxManager = {
        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
      };

      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb(mockTxManager),
      );

      await expect(
        service.adjust(
          {
            productId: 'prod-none',
            quantity: 5,
            type: MovementType.IN,
          },
          'user-uuid-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('applyPurchaseReceipt debe procesar recepción y crear o actualizar inventario', async () => {
      const mockTxManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null) // para item 1 (nuevo)
          .mockResolvedValueOnce({ productId: 'prod-2', stock: 5 }), // para item 2 (existente)
        create: jest.fn().mockImplementation((entityClass, data) => data),
        save: jest.fn().mockImplementation(async (entityClass, data) => data),
      };

      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb(mockTxManager),
      );

      await service.applyPurchaseReceipt(
        [
          { productId: 'prod-1', quantity: 10 },
          { productId: 'prod-2', quantity: 15 },
        ],
        'purchase-uuid-1',
        'user-uuid-1',
      );

      expect(mockTxManager.save).toHaveBeenCalled();
    });
  });

  describe('checkAndPauseProductsOnOutOfStock (Hook BE-PDT-11)', () => {
    it('debe actualizar productos ACTIVE asociados al inventario a status PAUSED dentro de la transacción y registrar Logger.log', async () => {
      const mockUpdateQb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      };

      const mockManager = {
        createQueryBuilder: jest.fn().mockReturnValue(mockUpdateQb),
      } as any;

      const logSpy = jest.spyOn((service as any).logger, 'log');

      await service.checkAndPauseProductsOnOutOfStock(
        'inv-uuid-1',
        InventoryStatus.OUT_OF_STOCK,
        mockManager,
      );

      expect(mockManager.createQueryBuilder).toHaveBeenCalled();
      expect(mockUpdateQb.update).toHaveBeenCalledWith(Product);
      expect(mockUpdateQb.set).toHaveBeenCalledWith({ status: 'PAUSED' });
      expect(mockUpdateQb.where).toHaveBeenCalledWith('inventory_id = :inventoryId', {
        inventoryId: 'inv-uuid-1',
      });
      expect(mockUpdateQb.andWhere).toHaveBeenCalledWith('status = :activeStatus', {
        activeStatus: 'ACTIVE',
      });
      expect(mockUpdateQb.andWhere).toHaveBeenCalledWith('deleted_at IS NULL');
      expect(logSpy).toHaveBeenCalledWith(
        'Productos pausados por OUT_OF_STOCK en inventario inv-uuid-1',
      );
    });

    it('no debe ejecutar la actualización si el nuevo estado del inventario no es OUT_OF_STOCK', async () => {
      const mockManager = {
        createQueryBuilder: jest.fn(),
      } as any;

      await service.checkAndPauseProductsOnOutOfStock(
        'inv-uuid-1',
        InventoryStatus.ACTIVE,
        mockManager,
      );

      expect(mockManager.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});

