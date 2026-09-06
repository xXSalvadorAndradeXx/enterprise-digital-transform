import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CustomerFavoritesService } from './customer-favorites.service';
import { CustomerFavorite } from './entities/customer-favorite.entity';
import { Product } from '../products/entities/product.entity';
import { ProductStatus } from '../products/enums/product-status.enum';
import { InventoryStatus } from '../inventory/enums/inventory-status.enum';

describe('CustomerFavoritesService', () => {
  let service: CustomerFavoritesService;
  let favoriteRepository: Repository<CustomerFavorite>;
  let productRepository: Repository<Product>;

  const mockProduct: Product = {
    id: 'prod-uuid-1',
    commercialName: 'Tenis Deportivos Runner',
    description: 'Tenis ligeros para correr',
    salePrice: 100,
    discount: 20,
    discountStartsAt: null,
    discountEndsAt: null,
    status: ProductStatus.ACTIVE,
    isPublished: true,
    publishedAt: new Date(),
    inventoryId: 'inv-uuid-1',
    inventory: {
      id: 'inv-uuid-1',
      status: InventoryStatus.ACTIVE,
      available: 10,
      stock: 10,
      category: { id: 'cat-1', name: 'Calzado' },
    } as any,
    images: [{ id: 'img-1', productId: 'prod-uuid-1', imageUrl: '/uploads/products/front.webp', sortOrder: 0, createdAt: new Date() }] as any,
    tags: [],
    variantConfigs: [],
    createdById: null,
    createdBy: null,
    updatedById: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    favorites: [],
    isActive: true,
    productId: 'prod-uuid-1',
  };

  const mockFavorite: CustomerFavorite = {
    id: 'fav-uuid-1',
    customerId: 'cust-uuid-1',
    productId: 'prod-uuid-1',
    customer: {} as any,
    product: mockProduct,
    createdAt: new Date('2026-08-25T20:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerFavoritesService,
        {
          provide: getRepositoryToken(CustomerFavorite),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomerFavoritesService>(CustomerFavoritesService);
    favoriteRepository = module.get<Repository<CustomerFavorite>>(
      getRepositoryToken(CustomerFavorite),
    );
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('add()', () => {
    it('debe agregar un producto a favoritos exitosamente (201)', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(favoriteRepository, 'create').mockReturnValue(mockFavorite);
      jest.spyOn(favoriteRepository, 'save').mockResolvedValue(mockFavorite);

      const result = await service.add('cust-uuid-1', 'prod-uuid-1');

      expect(result).toBeDefined();
      expect(result.favoriteId).toBe('fav-uuid-1');
      expect(result.product.commercialName).toBe('Tenis Deportivos Runner');
      expect(result.product.effectivePrice).toBe('80.00');
    });

    it('debe lanzar NotFoundException si el producto no existe', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.add('cust-uuid-1', 'prod-inexistente'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException (409 FAVORITE_ALREADY_EXISTS) si ya existe en favoritos', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(mockFavorite);

      await expect(
        service.add('cust-uuid-1', 'prod-uuid-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll()', () => {
    it('debe listar los favoritos paginados para un customerId específico', async () => {
      jest
        .spyOn(favoriteRepository, 'findAndCount')
        .mockResolvedValue([[mockFavorite], 1]);

      const result = await service.findAll('cust-uuid-1', { page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].product.id).toBe('prod-uuid-1');
      expect(result.items[0].product.hasDiscount).toBe(true);
    });

    it('debe filtrar de forma segura favoritos cuyo producto haya sido eliminado (soft delete)', async () => {
      const deletedFav = { ...mockFavorite, product: null } as any;
      jest
        .spyOn(favoriteRepository, 'findAndCount')
        .mockResolvedValue([[deletedFav], 1]);

      const result = await service.findAll('cust-uuid-1', { page: 1, limit: 10 });

      expect(result.items.length).toBe(0);
      expect(result.total).toBe(1);
    });
  });

  describe('remove()', () => {
    it('debe eliminar un favorito individual por customerId y productId', async () => {
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(mockFavorite);
      jest.spyOn(favoriteRepository, 'remove').mockResolvedValue(mockFavorite);

      const result = await service.remove('cust-uuid-1', 'prod-uuid-1');

      expect(result.success).toBe(true);
      expect(favoriteRepository.remove).toHaveBeenCalledWith(mockFavorite);
    });

    it('debe lanzar NotFoundException (FAVORITE_NOT_FOUND) si el favorito no existe', async () => {
      jest.spyOn(favoriteRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.remove('cust-uuid-1', 'prod-inexistente'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearAll()', () => {
    it('debe realizar la eliminación masiva por SQL del cliente autenticado', async () => {
      jest
        .spyOn(favoriteRepository, 'delete')
        .mockResolvedValue({ affected: 3, raw: [] });

      const result = await service.clearAll('cust-uuid-1');

      expect(result.deletedCount).toBe(3);
      expect(favoriteRepository.delete).toHaveBeenCalledWith({
        customerId: 'cust-uuid-1',
      });
    });

    it('debe ser idempotente y retornar deletedCount 0 si la lista estaba vacía', async () => {
      jest
        .spyOn(favoriteRepository, 'delete')
        .mockResolvedValue({ affected: 0, raw: [] });

      const result = await service.clearAll('cust-uuid-1');

      expect(result.deletedCount).toBe(0);
    });
  });

  describe('isFavorite()', () => {
    it('debe retornar true si el producto es favorito', async () => {
      jest.spyOn(favoriteRepository, 'count').mockResolvedValue(1);

      const status = await service.isFavorite('cust-uuid-1', 'prod-uuid-1');

      expect(status.isFavorite).toBe(true);
      expect(status.productId).toBe('prod-uuid-1');
    });

    it('debe retornar false si el producto no es favorito', async () => {
      jest.spyOn(favoriteRepository, 'count').mockResolvedValue(0);

      const status = await service.isFavorite('cust-uuid-1', 'prod-uuid-2');

      expect(status.isFavorite).toBe(false);
    });
  });
});
