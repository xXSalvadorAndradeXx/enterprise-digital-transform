import { Test, TestingModule } from '@nestjs/testing';
import { EcommerceCategoriesController } from './ecommerce-categories.controller';
import { CategoriesService } from './categories.service';
import { PublicCategoryResponseDto } from './dto/public-category-response.dto';
import { CategoryQueryDto } from './dto/category-query.dto';

describe('EcommerceCategoriesController', () => {
  let controller: EcommerceCategoriesController;
  let service: CategoriesService;

  const mockCategoryDto: PublicCategoryResponseDto = {
    id: 1,
    name: 'Calzado',
    slug: 'calzado',
    publishedProductsCount: 5,
    description: 'Zapatos y tenis',
  };

  const mockCategoriesService = {
    findAllPublic: jest.fn().mockResolvedValue([mockCategoryDto]),
    findOnePublic: jest.fn().mockResolvedValue(mockCategoryDto),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EcommerceCategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<EcommerceCategoriesController>(EcommerceCategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should return array of PublicCategoryResponseDto without query params', async () => {
    const result = await controller.findAll({});
    expect(result).toEqual([mockCategoryDto]);
    expect(service.findAllPublic).toHaveBeenCalledWith({});
  });

  it('findAll should pass publishedOnly=true to service', async () => {
    const queryDto: CategoryQueryDto = { publishedOnly: true };
    const result = await controller.findAll(queryDto);
    expect(result).toEqual([mockCategoryDto]);
    expect(service.findAllPublic).toHaveBeenCalledWith(queryDto);
  });

  it('findOne should return SingleResponse<PublicCategoryResponseDto>', async () => {
    const result = await controller.findOne(1);
    expect(result).toEqual({ data: mockCategoryDto });
    expect(service.findOnePublic).toHaveBeenCalledWith(1);
  });
});
