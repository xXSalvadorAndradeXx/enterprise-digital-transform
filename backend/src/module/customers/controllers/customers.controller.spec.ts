import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from '../customers.service';
import { CustomerNotificationsService } from '../services/customer-notifications.service';
import { CurrentCustomerPayload } from '../decorators/current-customer.decorator';
import { UpdateCustomerProfileDto } from '../dto/update-customer-profile.dto';

import {
  createMockCustomerPayload,
  createMockProfileResponse,
} from '../test/customer-profile.mock';

describe('CustomersController - Profile Endpoints', () => {
  let controller: CustomersController;
  let service: any;
  let notificationsService: any;

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
      createAddress: jest.fn(),
      updateAddress: jest.fn(),
      removeAddress: jest.fn(),
      setDefaultAddress: jest.fn(),
    };

    notificationsService = {
      getCustomerNotifications: jest.fn().mockResolvedValue({
        count: 1,
        notifications: [
          {
            id: 'notif-1',
            customerId: mockCustomerPayload.id,
            type: 'order.status_changed',
            title: 'Actualización de tu pedido',
            message: 'Tu pedido #A7K29P4Q está en camino a tu dirección de entrega.',
            orderNumber: 'A7K29P4Q',
            createdAt: new Date(),
          },
        ],
      }),
      createOrderStatusNotification: jest.fn().mockResolvedValue({
        success: true,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: service,
        },
        {
          provide: CustomerNotificationsService,
          useValue: notificationsService,
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

  describe('GET /customers/me/notifications', () => {
    it('debe retornar las notificaciones del cliente autenticado', async () => {
      const response = await controller.getMyNotifications(
        mockCustomerPayload,
        'order.status_changed',
      );

      expect(
        notificationsService.getCustomerNotifications,
      ).toHaveBeenCalledWith(mockCustomerPayload.id, 'order.status_changed');
      expect(response.success).toBe(true);
      expect(response.data.length).toBe(1);
      expect(response.meta.total).toBe(1);
    });
  });
});

