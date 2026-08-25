import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartStatus } from './enums/cart-status.enum';
import { CartResponseDto } from './dto/cart-response.dto';
import { UnauthorizedException } from '@nestjs/common';

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
        productName: 'Tenis Deportivos',
        commercialName: 'Tenis Deportivos',
        imageUrl: 'http://localhost:3000/uploads/products/img1.webp',
        primaryImage: 'http://localhost:3000/uploads/products/img1.webp',
        variant: {
          size: 'M',
          color: 'Negro',
        },
        size: 'M',
        color: 'Negro',
        quantity: 2,
        availableStock: 10,
        salePrice: '100.00',
        unitPrice: '90.00',
        effectiveUnitPrice: '90.00',
        lineDiscount: '20.00',
        lineTotal: '180.00',
        subtotal: '180.00',
      },
    ],
    subtotal: '200.00',
    discountTotal: '20.00',
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
    resolveCart: jest.fn().mockResolvedValue({
      cart: mockCartEntity,
      createdGuestToken: null,
    }),
    addItemToCart: jest.fn().mockResolvedValue(mockCartResponse),
    updateItemQuantity: jest.fn().mockResolvedValue(mockCartResponse),
    removeItem: jest.fn().mockResolvedValue(mockCartResponse),
    clearCart: jest.fn().mockResolvedValue(mockCartResponse),
    mergeGuestCartIntoUserCart: jest.fn().mockResolvedValue(mockCartResponse),
  };

  const mockResponse = {
    setHeader: jest.fn(),
  } as any;

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

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getCart should resolve cart and return SingleResponse', async () => {
    const req = { user: { userId: 'user-uuid-1' } };
    mockCartService.resolveCart.mockResolvedValueOnce({
      cart: mockCartEntity,
      createdGuestToken: null,
    });

    const result = await controller.getCart(req, undefined);
    expect(result.id).toBe('cart-uuid-1');
    expect(service.resolveCart).toHaveBeenCalledWith('user-uuid-1', undefined, false);
  });

  it('addItem should resolve cart and set X-Cart-Token header if new guest cart created', async () => {
    const req = { user: null };
    const dto = { productId: 'prod-uuid-1', variantId: 'variant-uuid-1', quantity: 2 };
    const plainGuestToken = 'new-plain-guest-token-123';

    mockCartService.resolveCart.mockResolvedValueOnce({
      cart: mockCartEntity,
      createdGuestToken: plainGuestToken,
    });
    mockCartService.addItemToCart.mockResolvedValueOnce(mockCartResponse);

    const result = await controller.addItem(req, mockResponse, undefined, dto);
    expect(result).toEqual(mockCartResponse);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Cart-Token', plainGuestToken);
  });

  it('mergeCart should call mergeGuestCartIntoUserCart when authenticated', async () => {
    const req = { user: { userId: 'user-uuid-1' } };
    const xCartToken = 'guest-token-to-merge';

    const result = await controller.mergeCart(req, xCartToken);
    expect(result).toEqual(mockCartResponse);
    expect(service.mergeGuestCartIntoUserCart).toHaveBeenCalledWith('user-uuid-1', xCartToken);
  });

  it('mergeCart should throw UnauthorizedException if req.user is missing', async () => {
    const req = { user: null };
    await expect(controller.mergeCart(req, 'guest-token')).rejects.toThrow(UnauthorizedException);
  });
});
