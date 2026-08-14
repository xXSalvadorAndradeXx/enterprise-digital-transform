import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { InventoryDetail } from '../inventory/entities/inventory-detail.entity';
import { InventoryStatus } from '../inventory/enums/inventory-status.enum';
import { ProductStatus } from './enums/product-status.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepositoryMock: any;
  let dataSourceMock: any;
  let queryRunnerMock: any;

  const mockInventory: Inventory = {
    id: 'inv-uuid-1',
    productName: 'Audífonos Bluetooth',
    brand: 'Sony',
    mainImageUrl: null,
    status: InventoryStatus.ACTIVE,
    stock: 100,
    reserved: 0,
    available: 100,
    supplier: null,
    supplierId: null,
    category: null,
    categoryId: null,
    purchase: null,
    purchaseId: null,
    details: [],
    product: null,
    productId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockInventoryDetail: InventoryDetail = {
    id: 'inv-detail-uuid-1',
    sku: 'SKU-AUD-RED',
    size: 'M',
    color: '#FF0000',
    stock: 50,
    unitCost: 10,
    minStock: 5,
    inventory: mockInventory,
    inventoryId: 'inv-uuid-1',
    purchaseItem: null,
    purchaseItemId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct: Product = {
    id: 'prod-uuid-1',
    inventoryId: 'inv-uuid-1',
    inventory: mockInventory,
    commercialName: 'Audífonos Sony Pro',
    description: 'Audífonos inalámbricos con cancelación de ruido',
    salePrice: 199.99,
    discount: 0,
    discountEndsAt: null,
    status: ProductStatus.ACTIVE,
    createdById: 'user-uuid-1',
    updatedById: 'user-uuid-1',
    createdBy: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    images: [],
    tags: [],
    variantConfigs: [],
  };

  const createQueryBuilderMock: any = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    productRepositoryMock = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      softRemove: jest.fn(),
    };

    queryRunnerMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
        create: jest.fn().mockImplementation((entityClass, dto) => ({
          id: 'generated-uuid',
          ...dto,
        })),
        save: jest.fn().mockImplementation((entityClass, entity) => {
          if (Array.isArray(entity)) return entity;
          return { id: 'generated-uuid', ...entity };
        }),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      },
    };

    dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockInventoryDetail),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepositoryMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (Transacción T7-1 y Reglas de Negocio)', () => {
    const validDto: CreateProductDto = {
      inventoryId: 'inv-uuid-1',
      commercialName: 'Audífonos Sony Pro',
      description: 'Cancelación de ruido',
      salePrice: 199.99,
      imageUrls: ['https://img.com/1.jpg'],
      tags: ['audio', 'sony', 'audio'],
      variantConfigs: [
        {
          inventoryDetailId: 'inv-detail-uuid-1',
          minStock: 10,
        },
      ],
    };

    it('debe crear un producto exitosamente dentro de la transacción T7-1 y deduplicar etiquetas', async () => {
      queryRunnerMock.manager.findOne
        .mockResolvedValueOnce(mockInventory)
        .mockResolvedValueOnce(mockInventoryDetail);
      createQueryBuilderMock.getOne.mockResolvedValue(null);

      productRepositoryMock.findOne.mockResolvedValue(mockProduct);

      const result = await service.create(validDto, { id: 'user-uuid-1' });

      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.manager.save).toHaveBeenCalled();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(result.id).toBe(mockProduct.id);
    });

    it('debe lanzar NotFoundException si el inventario especificado no existe', async () => {
      queryRunnerMock.manager.findOne.mockResolvedValueOnce(null);

      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException (RN-P-001) si el inventario está OUT_OF_STOCK', async () => {
      const outOfStockInventory = {
        ...mockInventory,
        status: InventoryStatus.OUT_OF_STOCK,
      };
      queryRunnerMock.manager.findOne.mockResolvedValueOnce(outOfStockInventory);

      await expect(service.create(validDto)).rejects.toThrow(ConflictException);
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException (RN-P-002) si el inventario ya está asociado a otro producto activo', async () => {
      queryRunnerMock.manager.findOne.mockResolvedValueOnce(mockInventory);
      createQueryBuilderMock.getOne.mockResolvedValue({ id: 'otro-prod-id' });

      await expect(service.create(validDto)).rejects.toThrow(ConflictException);
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe lanzar UnprocessableEntityException (RN-P-005) si hay descuento sin fecha de fin', async () => {
      const dtoDiscountNoDate: CreateProductDto = {
        ...validDto,
        discount: 15,
        discountEndsAt: undefined,
      };

      await expect(service.create(dtoDiscountNoDate)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('debe lanzar UnprocessableEntityException (RN-P-005) si la fecha de fin de descuento es menor a la actual', async () => {
      const dtoPastDiscount: CreateProductDto = {
        ...validDto,
        discount: 15,
        discountEndsAt: '2020-01-01T00:00:00Z',
      };

      await expect(service.create(dtoPastDiscount)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('debe lanzar UnprocessableEntityException si se envían más de 10 imágenes', async () => {
      const dto11Images: CreateProductDto = {
        ...validDto,
        imageUrls: Array(11).fill('https://img.com/foto.jpg'),
      };

      await expect(service.create(dto11Images)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('debe lanzar UnprocessableEntityException si se envían más de 20 etiquetas únicas', async () => {
      const dto21Tags: CreateProductDto = {
        ...validDto,
        tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
      };

      await expect(service.create(dto21Tags)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('debe lanzar UnprocessableEntityException si la variante no pertenece al inventario seleccionado', async () => {
      queryRunnerMock.manager.findOne
        .mockResolvedValueOnce(mockInventory)
        .mockResolvedValueOnce(null);
      createQueryBuilderMock.getOne.mockResolvedValue(null);

      await expect(service.create(validDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
    });

    it('debe registrar advertencia con Logger.warn si salePrice === 0 (RN-P-003)', async () => {
      const dtoZeroPrice: CreateProductDto = {
        ...validDto,
        salePrice: 0,
      };

      queryRunnerMock.manager.findOne
        .mockResolvedValueOnce(mockInventory)
        .mockResolvedValueOnce(mockInventoryDetail);
      createQueryBuilderMock.getOne.mockResolvedValue(null);
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);

      const warnSpy = jest.spyOn((service as any).logger, 'warn');

      await service.create(dtoZeroPrice);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('precio de venta igual a cero'),
      );
    });
  });

  describe('update (Transacción T7-2 y Reglas de Negocio)', () => {
    it('debe actualizar un producto exitosamente dentro de la transacción T7-2', async () => {
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);

      const updateDto: UpdateProductDto = {
        commercialName: 'Audífonos Sony Pro Max V2',
        salePrice: 249.99,
        imageUrls: ['https://img.com/v2.jpg'],
        tags: ['audio', 'sony-v2'],
        variantConfigs: [
          {
            inventoryDetailId: 'inv-detail-uuid-1',
            minStock: 8,
          },
        ],
      };

      const result = await service.update('prod-uuid-1', updateDto, {
        id: 'user-uuid-1',
      });

      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.manager.update).toHaveBeenCalledWith(
        Product,
        { id: 'prod-uuid-1' },
        expect.objectContaining({ commercialName: 'Audífonos Sony Pro Max V2' }),
      );
      expect(queryRunnerMock.manager.delete).toHaveBeenCalledTimes(3); // images, tags, variantConfigs
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(result.id).toBe(mockProduct.id);
    });

    it('debe lanzar UnprocessableEntityException si se incluye inventoryId en el DTO de actualización', async () => {
      const updateDtoWithInventory: UpdateProductDto = {
        inventoryId: 'nuevo-inv-uuid',
      };

      await expect(
        service.update('prod-uuid-1', updateDtoWithInventory),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('debe lanzar ConflictException si el producto tiene status === DISCONTINUED', async () => {
      const discontinuedProduct = {
        ...mockProduct,
        status: ProductStatus.DISCONTINUED,
      };
      productRepositoryMock.findOne.mockResolvedValue(discontinuedProduct);

      const updateDto: UpdateProductDto = {
        commercialName: 'Nuevo Nombre',
      };

      await expect(
        service.update('prod-uuid-1', updateDto),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar UnprocessableEntityException (RN-P-005) si se asigna descuento sin fecha de fin', async () => {
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);

      const updateDtoDiscountNoDate: UpdateProductDto = {
        discount: 20,
        discountEndsAt: undefined,
      };

      await expect(
        service.update('prod-uuid-1', updateDtoDiscountNoDate),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('debe lanzar UnprocessableEntityException si la variante no pertenece al inventario del producto', async () => {
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);
      dataSourceMock.getRepository().findOne.mockResolvedValueOnce(null);

      const updateDtoInvalidVariant: UpdateProductDto = {
        variantConfigs: [
          {
            inventoryDetailId: 'variante-ajena',
            minStock: 2,
          },
        ],
      };

      await expect(
        service.update('prod-uuid-1', updateDtoInvalidVariant),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('debe ejecutar rollbackTransaction y liberar queryRunner en caso de error durante la transacción', async () => {
      productRepositoryMock.findOne.mockResolvedValue(mockProduct);
      queryRunnerMock.manager.update.mockRejectedValueOnce(
        new Error('Fallo simulado en BD'),
      );

      const updateDto: UpdateProductDto = {
        commercialName: 'Fallo BD',
      };

      await expect(
        service.update('prod-uuid-1', updateDto),
      ).rejects.toThrow('Fallo simulado en BD');

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });
  });
});
