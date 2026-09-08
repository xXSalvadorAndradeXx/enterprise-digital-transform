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

  const mockCustomerPayload: CurrentCustomerPayload = createMockCustomerPayload();
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

      const response = await controller.updateMyProfile(mockCustomerPayload, dto);

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
});
