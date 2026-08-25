import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariantConfig } from '../products/entities/product-variant-config.entity';
import { CartStatus } from './enums/cart-status.enum';
import { ProductStatus } from '../products/enums/product-status.enum';
import { InventoryStatus } from '../inventory/enums/inventory-status.enum';

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

  it('findOrCreateCartForUser should return existing active cart', async () => {
    mockCartRepository.findOne.mockResolvedValueOnce(mockCart);
    const result = await service.findOrCreateCartForUser('user-uuid-1');
    expect(result).toEqual(mockCart);
  });

  it('findOrCreateCartForUser should create new cart if none exists', async () => {
    mockCartRepository.findOne.mockResolvedValueOnce(null);
    const result = await service.findOrCreateCartForUser('user-uuid-1');
    expect(result.customerId).toBe('user-uuid-1');
    expect(result.status).toBe(CartStatus.ACTIVE);
  });

  it('findOrCreateCartForGuest should return active guest cart', async () => {
    const guestCart = { ...mockCart, customerId: null, guestTokenHash: 'hash123' };
    mockCartRepository.findOne.mockResolvedValueOnce(guestCart);
    const result = await service.findOrCreateCartForGuest('hash123');
    expect(result.guestTokenHash).toBe('hash123');
  });

  it('addItemToCart should add new item when variant is not in cart', async () => {
    mockCartRepository.findOne.mockResolvedValue(mockCart);
    mockProductRepository.findOne.mockResolvedValue(mockProduct);
    mockVariantConfigRepository.findOne.mockResolvedValue(mockVariantConfig);
    mockCartItemRepository.findOne.mockResolvedValue(null);

    const dto = {
      productId: 'prod-uuid-1',
      variantId: 'variant-uuid-1',
      quantity: 2,
    };

    const result = await service.addItemToCart('cart-uuid-1', dto);
    expect(result.id).toBe('cart-uuid-1');
    expect(mockCartItemRepository.save).toHaveBeenCalled();
  });

  it('addItemToCart should accumulate quantity if variant already exists in cart', async () => {
    mockCartRepository.findOne.mockResolvedValue(mockCart);
    mockProductRepository.findOne.mockResolvedValue(mockProduct);
    mockVariantConfigRepository.findOne.mockResolvedValue(mockVariantConfig);
    mockCartItemRepository.findOne.mockResolvedValue(mockCartItem);

    const dto = {
      productId: 'prod-uuid-1',
      variantId: 'variant-uuid-1',
      quantity: 3,
    };

    await service.addItemToCart('cart-uuid-1', dto);
    expect(mockCartItemRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 5 }),
    );
  });

  it('addItemToCart should throw BadRequestException if variant does not belong to product', async () => {
    mockCartRepository.findOne.mockResolvedValue(mockCart);
    mockProductRepository.findOne.mockResolvedValue(mockProduct);
    mockVariantConfigRepository.findOne.mockResolvedValue(null);

    const dto = {
      productId: 'prod-uuid-1',
      variantId: 'invalid-variant',
      quantity: 1,
    };

    await expect(service.addItemToCart('cart-uuid-1', dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('addItemToCart should throw BadRequestException if cart is CHECKED_OUT', async () => {
    const checkedOutCart = { ...mockCart, status: CartStatus.CHECKED_OUT };
    mockCartRepository.findOne.mockResolvedValue(checkedOutCart);

    const dto = {
      productId: 'prod-uuid-1',
      variantId: 'variant-uuid-1',
      quantity: 1,
    };

    await expect(service.addItemToCart('cart-uuid-1', dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('updateItemQuantity should update quantity when > 0', async () => {
    mockCartRepository.findOne.mockResolvedValue(mockCart);
    mockCartItemRepository.findOne.mockResolvedValue(mockCartItem);

    await service.updateItemQuantity('cart-uuid-1', 'item-uuid-1', 4);
    expect(mockCartItemRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 4 }),
    );
  });

  it('updateItemQuantity should throw BadRequestException when quantity <= 0', async () => {
    await expect(
      service.updateItemQuantity('cart-uuid-1', 'item-uuid-1', 0),
    ).rejects.toThrow(BadRequestException);
  });

  it('removeItem should remove cart item', async () => {
    mockCartRepository.findOne.mockResolvedValue(mockCart);
    mockCartItemRepository.findOne.mockResolvedValue(mockCartItem);

    await service.removeItem('cart-uuid-1', 'item-uuid-1');
    expect(mockCartItemRepository.remove).toHaveBeenCalledWith(mockCartItem);
  });

  it('clearCart should delete all cart items', async () => {
    mockCartRepository.findOne.mockResolvedValue(mockCart);

    await service.clearCart('cart-uuid-1');
    expect(mockCartItemRepository.delete).toHaveBeenCalledWith({
      cartId: 'cart-uuid-1',
    });
  });
});
