// src/module/locations/locations.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

describe('LocationsController', () => {
  let controller: LocationsController;
  let service: any;

  beforeEach(async () => {
    service = {
      findActiveDepartments: jest.fn(),
      findDistrictsByDepartment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /locations/departments', () => {
    it('debe delegar a locationsService.findActiveDepartments', async () => {
      const mockResult = [{ id: 1, name: 'San Salvador', code: 'SS' }];
      service.findActiveDepartments.mockResolvedValue(mockResult);

      const result = await controller.getDepartments();

      expect(service.findActiveDepartments).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /locations/departments/:departmentId/districts', () => {
    it('debe delegar a locationsService.findDistrictsByDepartment con el departmentId', async () => {
      const mockResult = [
        { id: 101, name: 'San Salvador Centro', code: '101', departmentId: 1 },
      ];
      service.findDistrictsByDepartment.mockResolvedValue(mockResult);

      const result = await controller.getDistrictsByDepartment('1');

      expect(service.findDistrictsByDepartment).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResult);
    });
  });
});
