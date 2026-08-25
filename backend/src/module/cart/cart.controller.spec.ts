import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartStatus } from './enums/cart-status.enum';
import { CartResponseDto } from './dto/cart-response.dto';

describe('CartController', () => {
  let controller: CartController;
  let service: CartService;

  const mockCartResponse: CartResponseDto = {
    id: 'cart-uuid-1',
    customerId: 'user-uuid-1',
    guestTokenHash: null,
    status: CartStatus.ACTIVE,
    expiresAt: null,
    items: [
      {
        id: 'item-uuid-1',
        productId: 'prod-uuid-1',
        variantId: 'variant-uuid-1',
        commercialName: 'Tenis Deportivos',
        size: 'M',
        color: 'Negro',
        quantity: 2,
        unitPrice: '100.00',
        effectiveUnitPrice: '90.00',
        subtotal: '180.00',
        primaryImage: 'http://localhost:3000/uploads/products/img1.webp',
      },
    ],
    total: '180.00',
    itemCount: 2,
  };

  const mockCartEntity = {
    id: 'cart-uuid-1',
    customerId: 'user-uuid-1',
    guestTokenHash: null,
    status: CartStatus.ACTIVE,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    items: [],
  };

  const mockCartService = {
    findOrCreateCartForUser: jest.fn().mockResolvedValue(mockCartEntity),
    addItemToCart: jest.fn().mockResolvedValue(mockCartResponse),
    updateItemQuantity: jest.fn().mockResolvedValue(mockCartResponse),
    removeItem: jest.fn().mockResolvedValue(mockCartResponse),
    clearCart: jest.fn().mockResolvedValue(mockCartResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getCart should return user cart wrapped in SingleResponse', async () => {
    const req = { user: { userId: 'user-uuid-1' } };
    const result = await controller.getCart(req);
    expect(result.data.id).toBe('cart-uuid-1');
    expect(service.findOrCreateCartForUser).toHaveBeenCalledWith('user-uuid-1');
  });

  it('addItem should call addItemToCart and return updated cart', async () => {
    const req = { user: { userId: 'user-uuid-1' } };
    const dto = { productId: 'prod-uuid-1', variantId: 'variant-uuid-1', quantity: 2 };
    const result = await controller.addItem(req, dto);
    expect(result).toEqual({ data: mockCartResponse });
    expect(service.addItemToCart).toHaveBeenCalledWith('cart-uuid-1', dto);
  });

  it('updateItemQuantity should call updateItemQuantity and return updated cart', async () => {
    const req = { user: { userId: 'user-uuid-1' } };
    const dto = { quantity: 3 };
    const result = await controller.updateItemQuantity(req, 'item-uuid-1', dto);
    expect(result).toEqual({ data: mockCartResponse });
    expect(service.updateItemQuantity).toHaveBeenCalledWith('cart-uuid-1', 'item-uuid-1', 3);
  });

  it('removeItem should call removeItem and return updated cart', async () => {
    const req = { user: { userId: 'user-uuid-1' } };
    const result = await controller.removeItem(req, 'item-uuid-1');
    expect(result).toEqual({ data: mockCartResponse });
    expect(service.removeItem).toHaveBeenCalledWith('cart-uuid-1', 'item-uuid-1');
  });

  it('clearCart should call clearCart and return empty cart', async () => {
    const req = { user: { userId: 'user-uuid-1' } };
    const result = await controller.clearCart(req);
    expect(result).toEqual({ data: mockCartResponse });
    expect(service.clearCart).toHaveBeenCalledWith('cart-uuid-1');
  });
});
