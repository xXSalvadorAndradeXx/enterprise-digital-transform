import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { EcommerceAuthSession } from './entities/ecommerce-auth-session.entity';
import { Order } from '../orders/entities/order.entity';
import { LocationsService } from '../locations/locations.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HashService } from '../auth/services/hash.service';

describe('CustomersService - getMyProfile', () => {
  let service: CustomersService;
  let customerRepository: any;

  const mockCustomer = {
    id: 'd3b07384-d113-49cd-a5d6-8c4d5865dec1',
    fullName: 'Carlos Eduardo Gómez',
    email: 'carlos.gomez@correo.com',
    phone: '+50371234567',
    dui: '01234567-8',
    isActive: true,
    totalSpent: 150.5,
    totalOrders: 3,
    passwordHash: 'hashed_secret',
    createdAt: new Date('2026-08-26T19:53:00.000Z'),
    updatedAt: new Date('2026-08-26T19:53:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    customerRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: customerRepository,
        },
        {
          provide: getRepositoryToken(CustomerAddress),
          useValue: {},
        },
        {
          provide: getRepositoryToken(EcommerceAuthSession),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {},
        },
        {
          provide: LocationsService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: HashService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('debe retornar el perfil desde datos en caché sin invocar el repositorio de BD', async () => {
    const cachedUser = {
      id: mockCustomer.id,
      customerId: mockCustomer.id,
      fullName: mockCustomer.fullName,
      email: mockCustomer.email,
      phone: mockCustomer.phone,
      dui: mockCustomer.dui,
      createdAt: mockCustomer.createdAt,
    };

    const result = await service.getMyProfile(mockCustomer.id, cachedUser);

    expect(customerRepository.findOne).not.toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.id).toBe(mockCustomer.id);
    expect(result.name).toBe(mockCustomer.fullName);
    expect(result.fullName).toBe(mockCustomer.fullName);
    expect(result.email).toBe(mockCustomer.email);
    expect(result.phone).toBe(mockCustomer.phone);
    expect(result.dui).toBe(mockCustomer.dui);
    expect(result.role).toBe('cliente');
    expect((result as any).passwordHash).toBeUndefined();
    expect((result as any).totalSpent).toBeUndefined();
    expect((result as any).totalOrders).toBeUndefined();
  });

  it('debe consultar la BD con proyección mínima si no se proveen datos en caché', async () => {
    customerRepository.findOne.mockResolvedValue(mockCustomer);

    const result = await service.getMyProfile(mockCustomer.id);

    expect(customerRepository.findOne).toHaveBeenCalledWith({
      where: { id: mockCustomer.id, deletedAt: expect.anything() },
      select: ['id', 'fullName', 'email', 'phone', 'dui', 'isActive', 'createdAt'],
    });

    expect(result.id).toBe(mockCustomer.id);
    expect(result.name).toBe(mockCustomer.fullName);
    expect(result.email).toBe(mockCustomer.email);
    expect(result.phone).toBe(mockCustomer.phone);
  });

  it('debe lanzar NotFoundException si el cliente no existe en la base de datos', async () => {
    customerRepository.findOne.mockResolvedValue(null);

    await expect(service.getMyProfile('non-existent-uuid')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debe lanzar UnauthorizedException si la cuenta del cliente está inactiva/deshabilitada', async () => {
    customerRepository.findOne.mockResolvedValue({
      ...mockCustomer,
      isActive: false,
    });

    await expect(service.getMyProfile(mockCustomer.id)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe lanzar UnauthorizedException si el identificador está vacío', async () => {
    await expect(service.getMyProfile('')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
