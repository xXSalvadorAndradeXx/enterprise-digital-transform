import { Test, TestingModule } from '@nestjs/testing';
import { EcommerceCategoriesController } from './ecommerce-categories.controller';
import { CategoriesService } from './categories.service';
import { PublicCategoryResponseDto } from './dto/public-category-response.dto';

describe('EcommerceCategoriesController', () => {
  let controller: EcommerceCategoriesController;
  let service: CategoriesService;

  const mockCategoryDto: PublicCategoryResponseDto = {
    id: 1,
    name: 'Calzado',
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

  it('findAll should return array of PublicCategoryResponseDto', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockCategoryDto]);
    expect(service.findAllPublic).toHaveBeenCalled();
  });

  it('findOne should return SingleResponse<PublicCategoryResponseDto>', async () => {
    const result = await controller.findOne(1);
    expect(result).toEqual({ data: mockCategoryDto });
    expect(service.findOnePublic).toHaveBeenCalledWith(1);
  });
});
