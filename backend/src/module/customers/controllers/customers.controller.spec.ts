import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from '../customers.service';
import { CurrentCustomerPayload } from '../decorators/current-customer.decorator';
import { UpdateCustomerProfileDto } from '../dto/update-customer-profile.dto';
import { CreateCustomerAddressDto } from '../dto/create-customer-address.dto';

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

  describe('POST /customers/me/addresses', () => {
    it('debe registrar una dirección usando el customerId del JWT y retornar 201 Created con el DTO formateado', async () => {
      const dto: CreateCustomerAddressDto = {
        departmentId: '1',
        districtId: '187',
        alias: 'Casa',
        recipientName: 'Carlos Gómez',
        phone: '+50371234567',
        addressLine: 'Residencial San Francisco #14',
        reference: 'Frente al parque',
        isDefault: true,
        getResolvedLabel: () => 'Casa',
      };

      const mockSavedAddress = {
        id: 'addr-uuid-created-1',
        label: 'Casa',
        recipientName: 'Carlos Gómez',
        phone: '+50371234567',
        departmentId: 1,
        districtId: 187,
        department: { id: 1, name: 'San Salvador', code: 'SS' },
        district: { id: 187, name: 'Mejicanos', departmentId: 1 },
        city: 'San Salvador',
        addressLine: 'Residencial San Francisco #14',
        reference: 'Frente al parque',
        isDefault: true,
        createdAt: new Date('2026-09-08T12:00:00Z'),
        updatedAt: new Date('2026-09-08T12:00:00Z'),
      };

      service.createAddress.mockResolvedValue(mockSavedAddress);

      const response = await controller.createAddress(dto, mockCustomerPayload);

      expect(service.createAddress).toHaveBeenCalledWith(
        mockCustomerPayload.id,
        dto,
      );
      expect(response).toEqual({
        success: true,
        message: 'Dirección registrada correctamente.',
        data: expect.objectContaining({
          id: 'addr-uuid-created-1',
          alias: 'Casa',
          label: 'Casa',
          recipientName: 'Carlos Gómez',
          phone: '+50371234567',
          departmentId: 1,
          districtId: 187,
          isDefault: true,
          addressLine: 'Residencial San Francisco #14',
        }),
      });
    });
  });

  describe('PATCH /customers/me/addresses/:id', () => {
    it('debe delegar a customersService.updateAddress con id de dirección, customerId del JWT y el DTO', async () => {
      const addressId = '7b2e8a1d-5c43-4f2e-9d8a-1b2c3d4e5f60';
      const dto = {
        alias: 'Casa de Playa',
        phone: '+50379991122',
      };

      const mockUpdatedAddress = {
        id: addressId,
        label: 'Casa de Playa',
        recipientName: 'Carlos Gómez',
        phone: '+50379991122',
        departmentId: 1,
        districtId: 187,
        department: { id: 1, name: 'San Salvador', code: 'SS' },
        district: { id: 187, name: 'Mejicanos', departmentId: 1 },
        city: 'San Salvador',
        addressLine: 'Residencial San Francisco #14',
        reference: 'Frente al parque',
        isDefault: true,
        createdAt: new Date('2026-09-08T12:00:00Z'),
        updatedAt: new Date('2026-09-09T12:00:00Z'),
      };

      service.updateAddress.mockResolvedValue(mockUpdatedAddress);

      const response = await controller.updateAddress(
        addressId,
        dto as any,
        mockCustomerPayload,
      );

      expect(service.updateAddress).toHaveBeenCalledWith(
        mockCustomerPayload.id,
        addressId,
        dto,
      );
      expect(response).toEqual({
        success: true,
        message: 'Dirección actualizada correctamente.',
        data: expect.objectContaining({
          id: addressId,
          alias: 'Casa de Playa',
          label: 'Casa de Playa',
          phone: '+50379991122',
          departmentId: 1,
          districtId: 187,
          isDefault: true,
        }),
      });
    });
  });

  describe('PATCH /customers/me/addresses/:id/default', () => {
    it('debe delegar a customersService.setDefaultAddress con customerId del JWT y el id de dirección', async () => {
      const addressId = '7b2e8a1d-5c43-4f2e-9d8a-1b2c3d4e5f60';

      const mockDefaultAddress = {
        id: addressId,
        label: 'Casa',
        recipientName: 'Carlos Gómez',
        phone: '+50371234567',
        departmentId: 1,
        districtId: 187,
        department: { id: 1, name: 'San Salvador', code: 'SS' },
        district: { id: 187, name: 'Mejicanos', departmentId: 1 },
        city: 'San Salvador',
        addressLine: 'Residencial San Francisco #14',
        reference: 'Frente al parque',
        isDefault: true,
        createdAt: new Date('2026-09-08T12:00:00Z'),
        updatedAt: new Date('2026-09-09T12:00:00Z'),
      };

      service.setDefaultAddress.mockResolvedValue(mockDefaultAddress);

      const response = await controller.setDefaultAddress(
        addressId,
        mockCustomerPayload,
      );

      expect(service.setDefaultAddress).toHaveBeenCalledWith(
        mockCustomerPayload.id,
        addressId,
      );
      expect(response).toEqual({
        success: true,
        message: 'Dirección predeterminada actualizada correctamente.',
        data: expect.objectContaining({
          id: addressId,
          alias: 'Casa',
          label: 'Casa',
          isDefault: true,
        }),
      });
    });
  });

  describe('DELETE /customers/me/addresses/:id', () => {
    it('debe delegar a customersService.removeAddress con id de dirección y customerId del JWT, retornando deletedAddressId y newDefaultAddress', async () => {
      const addressId = '7b2e8a1d-5c43-4f2e-9d8a-1b2c3d4e5f60';

      const mockReallocatedAddress = {
        id: 'new-default-addr-id',
        label: 'Trabajo',
        recipientName: 'Carlos Gómez',
        phone: '+50371234567',
        departmentId: 1,
        districtId: 187,
        department: { id: 1, name: 'San Salvador', code: 'SS' },
        district: { id: 187, name: 'Mejicanos', departmentId: 1 },
        city: 'San Salvador',
        addressLine: 'Boulevard de los Héroes #123',
        reference: 'Torre Roble',
        isDefault: true,
        createdAt: new Date('2026-09-08T12:00:00Z'),
        updatedAt: new Date('2026-09-09T12:00:00Z'),
      };

      service.removeAddress.mockResolvedValue({
        deletedAddressId: addressId,
        newDefaultAddress: mockReallocatedAddress,
      });

      const response = await controller.removeAddress(
        addressId,
        mockCustomerPayload,
      );

      expect(service.removeAddress).toHaveBeenCalledWith(
        mockCustomerPayload.id,
        addressId,
      );
      expect(response).toEqual({
        success: true,
        message: 'Dirección eliminada correctamente.',
        data: {
          deletedAddressId: addressId,
          newDefaultAddress: expect.objectContaining({
            id: 'new-default-addr-id',
            alias: 'Trabajo',
            label: 'Trabajo',
            isDefault: true,
          }),
        },
      });
    });
  });
});
