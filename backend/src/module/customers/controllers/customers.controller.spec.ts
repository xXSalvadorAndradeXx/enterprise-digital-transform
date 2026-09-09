import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from '../customers.service';
import { CurrentCustomerPayload } from '../decorators/current-customer.decorator';
import { UpdateCustomerProfileDto } from '../dto/update-customer-profile.dto';

import {
  createMockCustomerPayload,
  createMockProfileResponse,
} from '../test/customer-profile.mock';

describe('CustomersController - Profile Endpoints', () => {
  let controller: CustomersController;
  let service: any;

  const mockCustomerPayload: CurrentCustomerPayload =
    createMockCustomerPayload();
  const mockProfileResponse = createMockProfileResponse();

  beforeEach(async () => {
    service = {
      getMyProfile: jest.fn().mockResolvedValue(mockProfileResponse),
      updateMyProfile: jest.fn().mockResolvedValue({
        ...mockProfileResponse,
        name: 'Carlos Actualizado',
        fullName: 'Carlos Actualizado',
        phone: '+50379998888',
      }),
      getAddresses: jest.fn(),
      findAllByCustomer: jest.fn(),
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      removeAddress: jest.fn(),
      setDefaultAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  describe('GET /customers/me', () => {
    it('debe delegar a customersService.getMyProfile con el ID y payload del cliente autenticado', async () => {
      const response = await controller.getMyProfile(mockCustomerPayload);

      expect(service.getMyProfile).toHaveBeenCalledWith(
        mockCustomerPayload.id,
        mockCustomerPayload,
      );
      expect(response).toEqual({
        success: true,
        data: mockProfileResponse,
      });
    });
  });

  describe('PATCH /customers/me', () => {
    it('debe delegar a customersService.updateMyProfile con el ID autenticado y el DTO', async () => {
      const dto: UpdateCustomerProfileDto = {
        name: 'Carlos Actualizado',
        phone: '+50379998888',
        getResolvedName: () => 'Carlos Actualizado',
      };

      const response = await controller.updateMyProfile(
        mockCustomerPayload,
        dto,
      );

      expect(service.updateMyProfile).toHaveBeenCalledWith(
        mockCustomerPayload.id,
        dto,
      );
      expect(response.success).toBe(true);
      expect(response.message).toBe('Perfil actualizado correctamente.');
      expect(response.data.name).toBe('Carlos Actualizado');
      expect(response.data.phone).toBe('+50379998888');
    });
  });

  describe('GET /customers/me/addresses', () => {
    it('debe retornar lista de direcciones del cliente autenticado con isDefault, alias y departamentos formateados', async () => {
      const mockAddress = {
        id: 'addr-uuid-1',
        label: 'Casa',
        recipientName: 'Carlos Gómez',
        phone: '+50371234567',
        departmentId: 1,
        districtId: 187,
        department: { id: 1, name: 'San Salvador', code: 'SS' },
        district: { id: 187, name: 'Mejicanos', departmentId: 1 },
        city: 'San Salvador',
        addressLine: 'Calle 1 #23',
        reference: 'Frente al parque',
        isDefault: true,
        createdAt: new Date('2026-09-08T10:00:00Z'),
        updatedAt: new Date('2026-09-08T10:00:00Z'),
      };

      service.findAllByCustomer.mockResolvedValue([mockAddress]);

      const response = await controller.getMyAddresses(mockCustomerPayload);

      expect(service.findAllByCustomer).toHaveBeenCalledWith(
        mockCustomerPayload.id,
      );
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].id).toBe('addr-uuid-1');
      expect(response.data[0].alias).toBe('Casa');
      expect(response.data[0].label).toBe('Casa');
      expect(response.data[0].isDefault).toBe(true);
      expect(response.data[0].departmentId).toBe(1);
      expect(response.data[0].districtId).toBe(187);
      expect(response.data[0].department.name).toBe('San Salvador');
      expect(response.data[0].district.name).toBe('Mejicanos');
    });

    it('debe retornar data: [] si el cliente no posee direcciones', async () => {
      service.findAllByCustomer.mockResolvedValue([]);

      const response = await controller.getMyAddresses(mockCustomerPayload);

      expect(response).toEqual({
        success: true,
        data: [],
      });
    });
  });
});
