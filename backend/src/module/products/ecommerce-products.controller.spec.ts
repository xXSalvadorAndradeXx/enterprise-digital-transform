import { Test, TestingModule } from '@nestjs/testing';
import { EcommerceProductsController } from './ecommerce-products.controller';
import { ProductsService } from './products.service';
import { PublicProductResponseDto } from './dto/public-product-response.dto';
import { PublicProductFilterDto, PublicAvailability, PublicGender } from './dto/public-product-filter.dto';

describe('EcommerceProductsController', () => {
  let controller: EcommerceProductsController;
  let service: ProductsService;

  const mockPublicProduct: PublicProductResponseDto = {
    id: 'prod-uuid-1',
    commercialName: 'Tenis Deportivos',
    description: 'Tenis ligeros',
    brand: 'Nike',
    gender: 'MEN',
    salePrice: '99.99',
    effectivePrice: '89.99',
    finalPrice: '89.99',
    discount: { percentage: 10, isActive: true },
    discountStartsAt: null,
    discountEndsAt: null,
    stockTotal: 10,
    availability: 'IN_STOCK',
    primaryImage: 'http://localhost:3000/uploads/products/img1.webp',
    availableSizes: ['M'],
    images: ['http://localhost:3000/uploads/products/img1.webp'],
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
      hasNextPage: false,
      hasPreviousPage: false,
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

  it('findAll should return paginated public products with default filters', async () => {
    const filterDto: PublicProductFilterDto = { page: 1, limit: 10 };
    const result = await controller.findAll(filterDto);
    expect(result).toEqual(mockPaginatedResponse);
    expect(service.findEcommerceProducts).toHaveBeenCalledWith(filterDto);
  });

  it('findAll should pass combined v1.2 filters to service', async () => {
    const filterDto: PublicProductFilterDto = {
      search: 'camisa',
      categoryId: 3,
      brand: 'Nike',
      gender: PublicGender.MEN,
      size: 'M',
      minPrice: 20,
      maxPrice: 80,
      availability: PublicAvailability.IN_STOCK,
      hasDiscount: true,
      page: 1,
      limit: 10,
    };

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
