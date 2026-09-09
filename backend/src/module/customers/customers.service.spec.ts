import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { EcommerceAuthSession } from './entities/ecommerce-auth-session.entity';
import { LocationsService } from '../locations/locations.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HashService } from '../auth/services/hash.service';

describe('CustomersService - getMyProfile', () => {
  let service: CustomersService;
  let customerRepository: any;
  let addressRepository: any;
  let sessionRepository: any;
  let configService: any;

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

    addressRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    sessionRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      }),
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
          useValue: addressRepository,
        },
        {
          provide: getRepositoryToken(EcommerceAuthSession),
          useValue: sessionRepository,
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
          useValue: configService,
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
      select: [
        'id',
        'fullName',
        'email',
        'phone',
        'dui',
        'isActive',
        'createdAt',
      ],
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

  describe('updateMyProfile', () => {
    it('debe actualizar name y phone con ownership respetado y retornar perfil actualizado', async () => {
      const existingCustomer = { ...mockCustomer };
      customerRepository.findOne.mockResolvedValue(existingCustomer);
      customerRepository.save.mockImplementation(async (cust: any) => ({
        ...cust,
      }));

      const dto = {
        name: 'Carlos Actualizado',
        phone: '+50379998888',
        getResolvedName: () => 'Carlos Actualizado',
      };

      const result = await service.updateMyProfile(mockCustomer.id, dto);

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCustomer.id, deletedAt: expect.anything() },
      });
      expect(customerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockCustomer.id,
          fullName: 'Carlos Actualizado',
          phone: '+50379998888',
          email: mockCustomer.email, // email conservado inmutable
        }),
      );
      expect(result.name).toBe('Carlos Actualizado');
      expect(result.phone).toBe('+50379998888');
      expect(result.email).toBe(mockCustomer.email);
    });

    it('debe conservar los valores existentes cuando un campo opcional no venga en el request', async () => {
      const existingCustomer = { ...mockCustomer };
      customerRepository.findOne.mockResolvedValue(existingCustomer);
      customerRepository.save.mockImplementation(async (cust: any) => cust);

      const dto = {
        name: 'Nuevo Nombre Solamente',
        getResolvedName: () => 'Nuevo Nombre Solamente',
      };

      const result = await service.updateMyProfile(mockCustomer.id, dto);

      expect(customerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Nuevo Nombre Solamente',
          phone: mockCustomer.phone, // teléfono intacto
        }),
      );
      expect(result.phone).toBe(mockCustomer.phone);
    });

    it('debe normalizar el teléfono de 8 dígitos al formato salvadoreño +503', async () => {
      const existingCustomer = { ...mockCustomer };
      customerRepository.findOne.mockResolvedValue(existingCustomer);
      customerRepository.save.mockImplementation(async (cust: any) => cust);

      const dto = {
        phone: '61234567',
      };

      const result = await service.updateMyProfile(mockCustomer.id, dto as any);

      expect(customerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+50361234567',
        }),
      );
      expect(result.phone).toBe('+50361234567');
    });

    it('no debe llamar a save() si los valores enviados son idénticos a los existentes', async () => {
      const existingCustomer = { ...mockCustomer };
      customerRepository.findOne.mockResolvedValue(existingCustomer);

      const dto = {
        name: mockCustomer.fullName,
        phone: mockCustomer.phone,
        getResolvedName: () => mockCustomer.fullName,
      };

      const result = await service.updateMyProfile(mockCustomer.id, dto);

      expect(customerRepository.save).not.toHaveBeenCalled();
      expect(result.name).toBe(mockCustomer.fullName);
      expect(result.phone).toBe(mockCustomer.phone);
    });

    it('debe lanzar NotFoundException si el cliente no existe al intentar actualizar', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateMyProfile('non-existent', { name: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar UnauthorizedException si la cuenta del cliente está inactiva al actualizar', async () => {
      customerRepository.findOne.mockResolvedValue({
        ...mockCustomer,
        isActive: false,
      });

      await expect(
        service.updateMyProfile(mockCustomer.id, { name: 'Test' } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe ignorar campos no permitidos (email, customerId, role, id) y conservar los valores originales intactos', async () => {
      const existingCustomer = { ...mockCustomer };
      customerRepository.findOne.mockResolvedValue(existingCustomer);
      customerRepository.save.mockImplementation(async (cust: any) => ({
        ...cust,
      }));

      const maliciousDto = {
        name: 'Carlos Actualizado',
        phone: '+50378889999',
        email: 'attacker@evil.com',
        customerId: 'hacked-id',
        id: 'hacked-id',
        role: 'admin',
        totalOrders: 9999,
        getResolvedName: () => 'Carlos Actualizado',
      };

      const result = await service.updateMyProfile(
        mockCustomer.id,
        maliciousDto,
      );

      expect(customerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockCustomer.id,
          email: mockCustomer.email,
          fullName: 'Carlos Actualizado',
          phone: '+50378889999',
        }),
      );
      expect(result.email).toBe(mockCustomer.email);
      expect(result.id).toBe(mockCustomer.id);
      expect(result.role).toBe('cliente');
    });
  });

  describe('revokeSession', () => {
    it('debe marcar revokedAt en la sesión activa y guardarla en la base de datos', async () => {
      const mockSession = {
        id: 'session-123',
        customerId: mockCustomer.id,
        refreshTokenHash: 'some_hash',
        revokedAt: null,
      };

      sessionRepository.findOne.mockResolvedValue(mockSession);
      sessionRepository.save.mockResolvedValue({
        ...mockSession,
        revokedAt: new Date(),
      });

      await service.revokeSession('valid_refresh_token');

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: {
          refreshTokenHash: expect.any(String),
          revokedAt: expect.anything(),
        },
      });
      expect(sessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-123',
          revokedAt: expect.any(Date),
        }),
      );
    });

    it('debe ser idempotente si la sesión no existe o ya está revocada', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.revokeSession('already_revoked_token'),
      ).resolves.not.toThrow();

      expect(sessionRepository.save).not.toHaveBeenCalled();
    });

    it('debe ser idempotente si se envía un valor vacío o no string', async () => {
      await expect(service.revokeSession('')).resolves.not.toThrow();
      await expect(service.revokeSession(null as any)).resolves.not.toThrow();
      expect(sessionRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('clearRefreshTokenCookie', () => {
    it('debe invocar clearCookie con el nombre y path estandarizado del módulo auth', () => {
      const mockRes = {
        clearCookie: jest.fn(),
      } as any;

      service.clearRefreshTokenCookie(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/api/v1/ecommerce/auth',
          secure: true,
        }),
      );
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          path: '/',
        }),
      );
    });
  });

  describe('findAllByCustomer', () => {
    it('debe retornar las direcciones del cliente ordenadas con la principal primero', async () => {
      const mockAddresses = [
        {
          id: 'addr-1',
          label: 'Casa',
          departmentId: 1,
          districtId: 187,
          isDefault: true,
          createdAt: new Date('2026-09-01T10:00:00Z'),
          department: { id: 1, name: 'San Salvador', code: 'SS' },
          district: { id: 187, name: 'Mejicanos', departmentId: 1 },
        },
        {
          id: 'addr-2',
          label: 'Trabajo',
          departmentId: 1,
          districtId: 190,
          isDefault: false,
          createdAt: new Date('2026-09-02T10:00:00Z'),
          department: { id: 1, name: 'San Salvador', code: 'SS' },
          district: { id: 190, name: 'San Salvador', departmentId: 1 },
        },
      ];

      addressRepository.find.mockResolvedValue(mockAddresses);

      const result = await service.findAllByCustomer(mockCustomer.id);

      expect(addressRepository.find).toHaveBeenCalledWith({
        where: { customerId: mockCustomer.id, deletedAt: expect.anything() },
        relations: ['department', 'district'],
        order: {
          isDefault: 'DESC',
          createdAt: 'DESC',
          id: 'ASC',
        },
      });
      expect(result).toHaveLength(2);
      expect(result[0].isDefault).toBe(true);
      expect(result[0].id).toBe('addr-1');
    });

    it('debe retornar un arreglo vacío [] cuando el cliente no tiene direcciones registradas', async () => {
      addressRepository.find.mockResolvedValue([]);

      const result = await service.findAllByCustomer(mockCustomer.id);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('getAddresses debe delegar idénticamente a findAllByCustomer', async () => {
      addressRepository.find.mockResolvedValue([]);

      const result = await service.getAddresses(mockCustomer.id);

      expect(result).toEqual([]);
      expect(addressRepository.find).toHaveBeenCalled();
    });
  });
});
