import { Test, TestingModule } from '@nestjs/testing';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { PublicBranchResponseDto } from './dto/public-branch-response.dto';
import { BranchQueryDto } from './dto/branch-query.dto';

describe('BranchesController', () => {
  let controller: BranchesController;
  let service: BranchesService;

  const mockPublicBranch: PublicBranchResponseDto = {
    id: 'branch-uuid-1',
    code: 'SUC-001',
    name: 'Sucursal Central Escalón',
    address: 'Paseo General Escalón #1234',
    phone: '2222-0000',
    allowsPickup: true,
    department: { id: 1, name: 'San Salvador' },
    district: { id: 1, name: 'San Salvador Centro' },
  };

  const mockBranchesService = {
    findAllPublic: jest.fn().mockResolvedValue([mockPublicBranch]),
    validateDepartmentDistrict: jest.fn().mockResolvedValue({
      department: { id: 1, name: 'San Salvador' },
      district: { id: 1, name: 'San Salvador Centro' },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [
        {
          provide: BranchesService,
          useValue: mockBranchesService,
        },
      ],
    }).compile();

    controller = module.get<BranchesController>(BranchesController);
    service = module.get<BranchesService>(BranchesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should return array of PublicBranchResponseDto without query params', async () => {
    const result = await controller.findAll({});
    expect(result).toEqual([mockPublicBranch]);
    expect(service.findAllPublic).toHaveBeenCalledWith({});
  });

  it('findAll should pass allowsPickup=true to service', async () => {
    const queryDto: BranchQueryDto = { allowsPickup: true };
    const result = await controller.findAll(queryDto);
    expect(result).toEqual([mockPublicBranch]);
    expect(service.findAllPublic).toHaveBeenCalledWith(queryDto);
  });
});
