import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariantConfig } from '../products/entities/product-variant-config.entity';
import { CartStatus } from './enums/cart-status.enum';
import { ProductStatus } from '../products/enums/product-status.enum';
import { InventoryStatus } from '../inventory/enums/inventory-status.enum';
import { hashGuestToken } from '../../common/utils/security.util';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: Repository<Cart>;
  let cartItemRepository: Repository<CartItem>;
  let productRepository: Repository<Product>;
  let variantConfigRepository: Repository<ProductVariantConfig>;

  const mockProduct: Product = {
    id: 'prod-uuid-1',
    commercialName: 'Tenis Deportivos',
    description: 'Tenis de entrenamiento',
    salePrice: 100,
    discount: 10,
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
    } as any,
    images: [],
    tags: [],
    variantConfigs: [],
    createdById: null,
    createdBy: null,
    updatedById: null,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockVariantConfig: ProductVariantConfig = {
    id: 'variant-uuid-1',
    productId: 'prod-uuid-1',
    inventoryDetailId: 'inv-detail-uuid-1',
    minStock: 1,
    product: mockProduct,
    inventoryDetail: {
      id: 'inv-detail-uuid-1',
      size: 'M',
      color: 'Negro',
      stock: 10,
    } as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCartItem: CartItem = {
    id: 'item-uuid-1',
    cartId: 'cart-uuid-1',
    productId: 'prod-uuid-1',
    variantId: 'variant-uuid-1',
    quantity: 2,
    cart: {} as any,
    product: mockProduct,
    variantConfig: mockVariantConfig,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCart: Cart = {
    id: 'cart-uuid-1',
    customerId: 'user-uuid-1',
    customer: null,
    guestTokenHash: null,
    status: CartStatus.ACTIVE,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    items: [mockCartItem],
  };

  const mockCartRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'cart-uuid-1' })),
    save: jest.fn().mockImplementation((cart) => Promise.resolve(cart)),
  };

  const mockCartItemRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'item-uuid-1' })),
    save: jest.fn().mockImplementation((item) => Promise.resolve(item)),
    remove: jest.fn().mockResolvedValue(mockCartItem),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
  };

  const mockVariantConfigRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb) =>
      cb({
        getRepository: (entity: any) => {
          if (entity === Cart) return mockCartRepository;
          if (entity === CartItem) return mockCartItemRepository;
          if (entity === Product) return mockProductRepository;
          if (entity === ProductVariantConfig) return mockVariantConfigRepository;
          return null;
        },
      }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useValue: mockCartRepository,
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: mockCartItemRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductVariantConfig),
          useValue: mockVariantConfigRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    cartItemRepository = module.get<Repository<CartItem>>(getRepositoryToken(CartItem));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    variantConfigRepository = module.get<Repository<ProductVariantConfig>>(
      getRepositoryToken(ProductVariantConfig),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveCart', () => {
    it('should prioritize userId when authenticated JWT is present', async () => {
      mockCartRepository.findOne.mockResolvedValueOnce(mockCart);
      const result = await service.resolveCart('user-uuid-1', 'some-guest-token');
      expect(result.cart).toEqual(mockCart);
      expect(result.createdGuestToken).toBeNull();
    });

    it('should throw CART_NOT_FOUND when user has no active cart on read/update', async () => {
      mockCartRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.resolveCart('user-uuid-1', null, false)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should resolve guest cart via valid X-Cart-Token', async () => {
      const plainToken = 'guest-token-123';
      const tokenHash = hashGuestToken(plainToken);
      const guestCart = {
        ...mockCart,
        customerId: null,
        guestTokenHash: tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      };

      mockCartRepository.findOne.mockResolvedValueOnce(guestCart);

      const result = await service.resolveCart(null, plainToken);
      expect(result.cart).toEqual(guestCart);
      expect(result.createdGuestToken).toBeNull();
    });

    it('should throw CART_TOKEN_INVALID if X-Cart-Token does not exist in DB', async () => {
      mockCartRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.resolveCart(null, 'invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('mergeGuestCartIntoUserCart', () => {
    it('should throw CART_TOKEN_INVALID if xCartToken is missing', async () => {
      await expect(service.mergeGuestCartIntoUserCart('user-uuid-1', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should merge guest cart into user cart successfully and mark guest cart ABANDONED', async () => {
      const plainToken = 'guest-token-merge-123';
      const tokenHash = hashGuestToken(plainToken);

      const guestItem: CartItem = {
        id: 'guest-item-1',
        cartId: 'guest-cart-1',
        productId: 'prod-uuid-1',
        variantId: 'variant-uuid-1',
        quantity: 3,
        cart: {} as any,
        product: mockProduct,
        variantConfig: mockVariantConfig,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const guestCart: Cart = {
        id: 'guest-cart-1',
        customerId: null,
        customer: null,
        guestTokenHash: tokenHash,
        status: CartStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        items: [guestItem],
      };

      // 1. guestCart lookup -> guestCart
      // 2. userCart lookup -> mockCart
      // 3. findActiveCartById at end -> mockCart
      mockCartRepository.findOne
        .mockResolvedValueOnce(guestCart)
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockCart);

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockVariantConfigRepository.findOne.mockResolvedValue(mockVariantConfig);

      const result = await service.mergeGuestCartIntoUserCart('user-uuid-1', plainToken);
      expect(result.id).toBe('cart-uuid-1');
      expect(mockCartItemRepository.save).toHaveBeenCalled();
      expect(mockCartRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CartStatus.ABANDONED }),
      );
    });

    it('should throw STOCK_INSUFFICIENT when combined quantity exceeds available stock', async () => {
      const plainToken = 'guest-token-merge-excess';
      const tokenHash = hashGuestToken(plainToken);

      const guestItem: CartItem = {
        id: 'guest-item-1',
        cartId: 'guest-cart-1',
        productId: 'prod-uuid-1',
        variantId: 'variant-uuid-1',
        quantity: 5,
        cart: {} as any,
        product: mockProduct,
        variantConfig: mockVariantConfig,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const guestCart: Cart = {
        id: 'guest-cart-1',
        customerId: null,
        customer: null,
        guestTokenHash: tokenHash,
        status: CartStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        items: [guestItem],
      };

      mockCartRepository.findOne
        .mockResolvedValueOnce(guestCart)
        .mockResolvedValueOnce({
          ...mockCart,
          items: [{ ...mockCartItem, quantity: 6 }], // 6 + 5 = 11 > 10
        });

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockVariantConfigRepository.findOne.mockResolvedValue({
        ...mockVariantConfig,
        inventoryDetail: { stock: 10 } as any,
      });

      try {
        await service.mergeGuestCartIntoUserCart('user-uuid-1', plainToken);
        fail('Should throw BadRequestException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err.getResponse().code).toBe('STOCK_INSUFFICIENT');
        expect(err.getResponse().details).toEqual({
          variantId: 'variant-uuid-1',
          requestedQuantity: 11,
          availableStock: 10,
        });
      }
    });
  });
});
