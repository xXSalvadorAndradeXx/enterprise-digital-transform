// src/module/locations/locations.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Department } from '../branches/entities/department.entity';
import { District } from '../branches/entities/district.entity';
import { LOCATION_ERRORS } from './constants/location-error-codes';

describe('LocationsService', () => {
  let service: LocationsService;
  let departmentRepo: any;
  let districtRepo: any;

  const mockActiveDept: Department = {
    id: 1,
    name: 'San Salvador',
    code: 'SS',
    isActive: true,
    districts: [],
  };

  const mockInactiveDept: Department = {
    id: 2,
    name: 'Departamento Inactivo',
    code: 'DI',
    isActive: false,
    districts: [],
  };

  const mockActiveDistrict: District = {
    id: 101,
    name: 'San Salvador Centro',
    departmentId: 1,
    department: mockActiveDept,
    isActive: true,
  };

  const mockInactiveDistrict: District = {
    id: 102,
    name: 'Distrito Inactivo',
    departmentId: 1,
    department: mockActiveDept,
    isActive: false,
  };

  const mockOtherDistrict: District = {
    id: 201,
    name: 'Santa Ana Centro',
    departmentId: 3,
    department: {} as any,
    isActive: true,
  };

  beforeEach(async () => {
    departmentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    districtRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: getRepositoryToken(Department),
          useValue: departmentRepo,
        },
        {
          provide: getRepositoryToken(District),
          useValue: districtRepo,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  describe('findActiveDepartments', () => {
    it('debe retornar únicamente los departamentos activos ordenados por nombre', async () => {
      departmentRepo.find.mockResolvedValue([mockActiveDept]);

      const result = await service.findActiveDepartments();

      expect(departmentRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockActiveDept.id,
        name: mockActiveDept.name,
        code: mockActiveDept.code,
      });
    });
  });

  describe('findDistrictsByDepartment', () => {
    it('debe retornar los distritos activos cuando el departamento existe y está activo', async () => {
      departmentRepo.findOne.mockResolvedValue(mockActiveDept);
      districtRepo.find.mockResolvedValue([mockActiveDistrict]);

      const result = await service.findDistrictsByDepartment(1);

      expect(departmentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, isActive: true },
      });
      expect(districtRepo.find).toHaveBeenCalledWith({
        where: { departmentId: 1, isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('San Salvador Centro');
    });

    it('debe lanzar NotFoundException DEPARTMENT_NOT_FOUND si el departamento no existe o está inactivo', async () => {
      departmentRepo.findOne.mockResolvedValue(null);

      await expect(service.findDistrictsByDepartment(999)).rejects.toThrow(
        NotFoundException,
      );

      try {
        await service.findDistrictsByDepartment(999);
      } catch (error: any) {
        const res = error.getResponse();
        expect(res.code).toBe(LOCATION_ERRORS.DEPARTMENT_NOT_FOUND);
      }
    });
  });

  describe('validateDepartmentDistrict', () => {
    it('debe retornar { department, district } si ambos existen, están activos y coinciden', async () => {
      departmentRepo.findOne.mockResolvedValue(mockActiveDept);
      districtRepo.findOne.mockResolvedValue(mockActiveDistrict);

      const result = await service.validateDepartmentDistrict(1, 101);

      expect(result.department).toEqual(mockActiveDept);
      expect(result.district).toEqual(mockActiveDistrict);
    });

    it('debe lanzar NotFoundException DEPARTMENT_NOT_FOUND si el departamento no existe', async () => {
      departmentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.validateDepartmentDistrict(999, 101),
      ).rejects.toThrow(NotFoundException);

      try {
        await service.validateDepartmentDistrict(999, 101);
      } catch (error: any) {
        const res = error.getResponse();
        expect(res.code).toBe(LOCATION_ERRORS.DEPARTMENT_NOT_FOUND);
      }
    });

    it('debe lanzar UnprocessableEntityException INVALID_LOCATION si el departamento está inactivo', async () => {
      departmentRepo.findOne.mockResolvedValue(mockInactiveDept);

      await expect(
        service.validateDepartmentDistrict(2, 101),
      ).rejects.toThrow(UnprocessableEntityException);

      try {
        await service.validateDepartmentDistrict(2, 101);
      } catch (error: any) {
        const res = error.getResponse();
        expect(res.code).toBe(LOCATION_ERRORS.INVALID_LOCATION);
      }
    });

    it('debe lanzar NotFoundException DISTRICT_NOT_FOUND si el distrito no existe', async () => {
      departmentRepo.findOne.mockResolvedValue(mockActiveDept);
      districtRepo.findOne.mockResolvedValue(null);

      await expect(
        service.validateDepartmentDistrict(1, 999),
      ).rejects.toThrow(NotFoundException);

      try {
        await service.validateDepartmentDistrict(1, 999);
      } catch (error: any) {
        const res = error.getResponse();
        expect(res.code).toBe(LOCATION_ERRORS.DISTRICT_NOT_FOUND);
      }
    });

    it('debe lanzar UnprocessableEntityException INVALID_LOCATION si el distrito está inactivo', async () => {
      departmentRepo.findOne.mockResolvedValue(mockActiveDept);
      districtRepo.findOne.mockResolvedValue(mockInactiveDistrict);

      await expect(
        service.validateDepartmentDistrict(1, 102),
      ).rejects.toThrow(UnprocessableEntityException);

      try {
        await service.validateDepartmentDistrict(1, 102);
      } catch (error: any) {
        const res = error.getResponse();
        expect(res.code).toBe(LOCATION_ERRORS.INVALID_LOCATION);
      }
    });

    it('debe lanzar UnprocessableEntityException INVALID_LOCATION si el distrito no pertenece al departamento', async () => {
      departmentRepo.findOne.mockResolvedValue(mockActiveDept);
      districtRepo.findOne.mockResolvedValue(mockOtherDistrict);

      await expect(
        service.validateDepartmentDistrict(1, 201),
      ).rejects.toThrow(UnprocessableEntityException);

      try {
        await service.validateDepartmentDistrict(1, 201);
      } catch (error: any) {
        const res = error.getResponse();
        expect(res.code).toBe(LOCATION_ERRORS.INVALID_LOCATION);
      }
    });
  });
});
