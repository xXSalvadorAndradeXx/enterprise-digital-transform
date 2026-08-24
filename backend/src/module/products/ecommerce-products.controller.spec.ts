import { Test, TestingModule } from '@nestjs/testing';
import { EcommerceProductsController } from './ecommerce-products.controller';
import { ProductsService } from './products.service';
import { PublicProductResponseDto } from './dto/public-product-response.dto';
import { ProductFilterDto } from './dto/product-filter.dto';

describe('EcommerceProductsController', () => {
  let controller: EcommerceProductsController;
  let service: ProductsService;

  const mockPublicProduct: PublicProductResponseDto = {
    id: 'prod-uuid-1',
    commercialName: 'Tenis Deportivos',
    description: 'Tenis ligeros',
    salePrice: '99.99',
    discount: '10.00',
    finalPrice: '89.99',
    discountStartsAt: null,
    discountEndsAt: null,
    images: [],
    tags: ['deporte'],
    category: { id: 1, name: 'Calzado', slug: 'calzado', publishedProductsCount: 1, description: null },
    inStock: true,
    isPublished: true,
    publishedAt: '2026-08-15T12:00:00.000Z',
    variants: [],
  };

  const mockPaginatedResponse = {
    data: [mockPublicProduct],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  const mockProductsService = {
    findEcommerceProducts: jest.fn().mockResolvedValue(mockPaginatedResponse),
    findEcommerceProductById: jest.fn().mockResolvedValue(mockPublicProduct),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EcommerceProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<EcommerceProductsController>(EcommerceProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should return paginated public products', async () => {
    const filterDto: ProductFilterDto = { page: 1, limit: 10 };
    const result = await controller.findAll(filterDto);
    expect(result).toEqual(mockPaginatedResponse);
    expect(service.findEcommerceProducts).toHaveBeenCalledWith(filterDto);
  });

  it('findOne should return single public product', async () => {
    const result = await controller.findOne('prod-uuid-1');
    expect(result).toEqual({ data: mockPublicProduct });
    expect(service.findEcommerceProductById).toHaveBeenCalledWith('prod-uuid-1');
  });
});
