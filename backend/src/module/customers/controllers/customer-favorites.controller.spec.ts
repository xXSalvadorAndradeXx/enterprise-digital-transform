import { Test, TestingModule } from '@nestjs/testing';
import { CustomerFavoritesController } from './customer-favorites.controller';
import { CustomerFavoritesService } from '../customer-favorites.service';

describe('CustomerFavoritesController', () => {
  let controller: CustomerFavoritesController;
  let service: CustomerFavoritesService;

  const mockReq = {
    user: {
      id: 'cust-uuid-1',
      email: 'customer@example.com',
    },
  };

  const mockFavoriteResult = {
    favoriteId: 'fav-uuid-1',
    createdAt: '2026-08-25T20:00:00.000Z',
    product: {
      id: 'prod-uuid-1',
      commercialName: 'Tenis Deportivos Runner',
      imageUrl: '/uploads/products/front.webp',
      salePrice: '100.00',
      effectivePrice: '80.00',
      hasDiscount: true,
      inStock: true,
      availability: 'IN_STOCK',
    } as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerFavoritesController],
      providers: [
        {
          provide: CustomerFavoritesService,
          useValue: {
            findAll: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
            clearAll: jest.fn(),
            isFavorite: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CustomerFavoritesController>(
      CustomerFavoritesController,
    );
    service = module.get<CustomerFavoritesService>(CustomerFavoritesService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyFavorites()', () => {
    it('debe solicitar la lista paginada de favoritos pasando el customerId del JWT', async () => {
      const paginatedMock = {
        items: [mockFavoriteResult],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      jest.spyOn(service, 'findAll').mockResolvedValue(paginatedMock);

      const res = await controller.getMyFavorites(mockReq, {
        page: 1,
        limit: 10,
      });

      expect(service.findAll).toHaveBeenCalledWith('cust-uuid-1', {
        page: 1,
        limit: 10,
      });
      expect(res.success).toBe(true);
      expect(res.data.items.length).toBe(1);
    });
  });

  describe('addFavorite()', () => {
    it('debe agregar a favoritos usando req.user.id del JWT', async () => {
      jest.spyOn(service, 'add').mockResolvedValue(mockFavoriteResult);

      const res = await controller.addFavorite(mockReq, {
        productId: 'prod-uuid-1',
      });

      expect(service.add).toHaveBeenCalledWith('cust-uuid-1', 'prod-uuid-1');
      expect(res.success).toBe(true);
      expect(res.data.favoriteId).toBe('fav-uuid-1');
    });
  });

  describe('checkIsFavoriteStatus()', () => {
    it('debe retornar el estado de favorito del producto', async () => {
      jest.spyOn(service, 'isFavorite').mockResolvedValue({
        productId: 'prod-uuid-1',
        isFavorite: true,
      });

      const res = await controller.checkIsFavoriteStatus(
        mockReq,
        'prod-uuid-1',
      );

      expect(service.isFavorite).toHaveBeenCalledWith(
        'cust-uuid-1',
        'prod-uuid-1',
      );
      expect(res.success).toBe(true);
      expect(res.data.isFavorite).toBe(true);
    });
  });

  describe('removeFavorite()', () => {
    it('debe eliminar el favorito por productId para el cliente autenticado', async () => {
      jest.spyOn(service, 'remove').mockResolvedValue({
        success: true,
        message: 'Producto eliminado de favoritos correctamente',
      });

      const res = await controller.removeFavorite(mockReq, 'prod-uuid-1');

      expect(service.remove).toHaveBeenCalledWith('cust-uuid-1', 'prod-uuid-1');
      expect(res.success).toBe(true);
    });
  });

  describe('clearAllFavorites()', () => {
    it('debe vaciar todos los favoritos y retornar el contador de elementos eliminados', async () => {
      jest.spyOn(service, 'clearAll').mockResolvedValue({
        deletedCount: 4,
        message: 'Todos los favoritos han sido eliminados correctamente',
      });

      const res = await controller.clearAllFavorites(mockReq);

      expect(service.clearAll).toHaveBeenCalledWith('cust-uuid-1');
      expect(res.success).toBe(true);
      expect(res.data.deletedCount).toBe(4);
    });
  });
});
