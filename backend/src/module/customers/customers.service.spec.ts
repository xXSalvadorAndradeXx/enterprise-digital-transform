import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
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
  let locationsService: any;
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
      manager: {
        transaction: jest.fn(),
      },
    };

    locationsService = {
      validateDepartmentDistrict: jest.fn().mockResolvedValue(true),
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
          useValue: locationsService,
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

  describe('createAddress', () => {
    let mockManager: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
      mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      mockManager = {
        count: jest.fn(),
        create: jest.fn().mockImplementation((entityClass, data) => ({
          ...data,
          id: 'new-address-id',
        })),
        save: jest.fn().mockImplementation((entityClass, data) => Promise.resolve(data)),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      customerRepository.findOne.mockResolvedValue(mockCustomer);
      customerRepository.manager.transaction.mockImplementation((cb: any) =>
        cb(mockManager),
      );
      locationsService.validateDepartmentDistrict.mockResolvedValue(true);
    });

    it('debe crear la primera dirección y marcarla como isDefault = true automáticamente aunque en el DTO venga isDefault = false', async () => {
      mockManager.count.mockResolvedValue(0); // Primera dirección del cliente
      mockManager.findOne.mockResolvedValue({
        id: 'new-address-id',
        label: 'Casa',
        departmentId: 1,
        districtId: 187,
        isDefault: true,
        department: { id: 1, name: 'San Salvador' },
        district: { id: 187, name: 'Mejicanos' },
      });

      const dto = {
        departmentId: '1',
        districtId: '187',
        alias: 'Casa',
        addressLine: 'Colonia Escalón #123',
        isDefault: false, // Cliente envía false, pero al ser la primera DEBE ser default
      };

      const result = await service.createAddress(mockCustomer.id, dto as any);

      expect(locationsService.validateDepartmentDistrict).toHaveBeenCalledWith('1', '187');
      expect(mockManager.count).toHaveBeenCalledWith(CustomerAddress, {
        where: { customerId: mockCustomer.id, deletedAt: expect.anything() },
      });
      expect(mockManager.create).toHaveBeenCalledWith(
        CustomerAddress,
        expect.objectContaining({
          customerId: mockCustomer.id,
          isDefault: true, // Forzado por la regla de primera dirección
          label: 'Casa',
        }),
      );
      expect(result.isDefault).toBe(true);
    });

    it('debe crear una segunda dirección con isDefault = false sin desmarcar la dirección principal existente', async () => {
      mockManager.count.mockResolvedValue(1); // Ya posee 1 dirección activa
      mockManager.findOne.mockResolvedValue({
        id: 'second-address-id',
        label: 'Trabajo',
        departmentId: 1,
        districtId: 190,
        isDefault: false,
      });

      const dto = {
        departmentId: '1',
        districtId: '190',
        alias: 'Trabajo',
        addressLine: 'Centro Financiero #45',
        isDefault: false,
      };

      const result = await service.createAddress(mockCustomer.id, dto as any);

      expect(mockManager.createQueryBuilder).not.toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(
        CustomerAddress,
        expect.objectContaining({
          customerId: mockCustomer.id,
          isDefault: false,
        }),
      );
      expect(result.isDefault).toBe(false);
    });

    it('debe desmarcar en transacción la principal anterior si se crea una nueva dirección con isDefault = true', async () => {
      mockManager.count.mockResolvedValue(1); // Ya posee direcciones activas
      mockManager.findOne.mockResolvedValue({
        id: 'new-default-address-id',
        label: 'Oficina Central',
        departmentId: 1,
        districtId: 190,
        isDefault: true,
      });

      const dto = {
        departmentId: '1',
        districtId: '190',
        alias: 'Oficina Central',
        addressLine: 'Alameda Roosevelt #500',
        isDefault: true,
      };

      const result = await service.createAddress(mockCustomer.id, dto as any);

      // clearDefaultAddress invocado dentro de la misma transacción
      expect(mockManager.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(CustomerAddress);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ isDefault: false });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'customer_id = :customerId AND is_default = true AND deleted_at IS NULL',
        { customerId: mockCustomer.id },
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        CustomerAddress,
        expect.objectContaining({
          customerId: mockCustomer.id,
          isDefault: true,
        }),
      );
      expect(result.isDefault).toBe(true);
    });

    it('debe lanzar BadRequestException si falta departmentId o districtId', async () => {
      await expect(
        service.createAddress(mockCustomer.id, { departmentId: '1' } as any),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createAddress(mockCustomer.id, { districtId: '187' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe propagar el error si locationsService.validateDepartmentDistrict falla', async () => {
      locationsService.validateDepartmentDistrict.mockRejectedValue(
        new BadRequestException('El distrito no pertenece al departamento'),
      );

      await expect(
        service.createAddress(mockCustomer.id, {
          departmentId: '1',
          districtId: '999',
          alias: 'Casa',
          addressLine: 'Calle Falsa 123',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAddress', () => {
    let mockManager: any;
    let mockQueryBuilder: any;
    const addressId = 'addr-uuid-existing-1';

    const existingAddress: any = {
      id: addressId,
      customerId: mockCustomer.id,
      departmentId: 1,
      districtId: 187,
      city: 'San Salvador',
      addressLine: 'Calle Antigua #10',
      label: 'Casa',
      recipientName: 'Carlos Gómez',
      phone: '+50371234567',
      reference: 'Frente a tienda',
      isDefault: true,
      createdAt: new Date('2026-09-01T10:00:00Z'),
      updatedAt: new Date('2026-09-01T10:00:00Z'),
    };

    beforeEach(() => {
      mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      mockManager = {
        count: jest.fn(),
        save: jest.fn().mockImplementation((entityClass, data) => Promise.resolve(data)),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      customerRepository.manager.transaction.mockImplementation((cb: any) =>
        cb(mockManager),
      );
      locationsService.validateDepartmentDistrict.mockResolvedValue(true);
    });

    it('debe actualizar los campos permitidos y retornar la dirección con sus relaciones', async () => {
      addressRepository.findOne.mockResolvedValue({ ...existingAddress });
      mockManager.findOne.mockResolvedValue({
        ...existingAddress,
        label: 'Casa Actualizada',
        phone: '+50379998888',
        department: { id: 1, name: 'San Salvador' },
        district: { id: 187, name: 'Mejicanos' },
      });

      const dto = {
        alias: 'Casa Actualizada',
        phone: '+50379998888',
        customerId: 'malicious-injected-id', // Campo protegido que debe ser ignorado
        id: 'different-uuid', // Campo protegido que debe ser ignorado
      };

      const result = await service.updateAddress(mockCustomer.id, addressId, dto as any);

      expect(addressRepository.findOne).toHaveBeenCalledWith({
        where: { id: addressId, customerId: mockCustomer.id },
      });
      // No modificó departamento ni distrito, no llama a validación
      expect(locationsService.validateDepartmentDistrict).not.toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalledWith(
        CustomerAddress,
        expect.objectContaining({
          id: addressId,
          customerId: mockCustomer.id,
          label: 'Casa Actualizada',
          phone: '+50379998888',
        }),
      );
      expect(result.id).toBe(addressId);
    });

    it('debe lanzar NotFoundException con código ADDRESS_NOT_FOUND si la dirección no existe o pertenece a otro cliente', async () => {
      addressRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAddress(mockCustomer.id, 'unknown-id', { alias: 'Otro' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe revalidar el par departamento-distrito si se modifica departmentId o districtId', async () => {
      addressRepository.findOne.mockResolvedValue({ ...existingAddress });
      mockManager.findOne.mockResolvedValue({
        ...existingAddress,
        departmentId: 2,
        districtId: 205,
      });

      const dto = {
        departmentId: 2,
        districtId: 205,
      };

      await service.updateAddress(mockCustomer.id, addressId, dto as any);

      expect(locationsService.validateDepartmentDistrict).toHaveBeenCalledWith(2, 205);
    });

    it('debe desmarcar en transacción la principal anterior si se actualiza con isDefault = true', async () => {
      const nonDefaultAddress = { ...existingAddress, isDefault: false };
      addressRepository.findOne.mockResolvedValue(nonDefaultAddress);
      mockManager.findOne.mockResolvedValue({ ...nonDefaultAddress, isDefault: true });

      const dto = { isDefault: true };

      const result = await service.updateAddress(mockCustomer.id, addressId, dto as any);

      expect(mockManager.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(CustomerAddress);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ isDefault: false });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'customer_id = :customerId AND is_default = true AND deleted_at IS NULL',
        { customerId: mockCustomer.id },
      );
      expect(mockManager.save).toHaveBeenCalledWith(
        CustomerAddress,
        expect.objectContaining({ isDefault: true }),
      );
      expect(result.isDefault).toBe(true);
    });

    it('no debe permitir desmarcar isDefault a false si es la única dirección activa del cliente', async () => {
      addressRepository.findOne.mockResolvedValue({ ...existingAddress, isDefault: true });
      mockManager.count.mockResolvedValue(1); // Es la única dirección activa
      mockManager.findOne.mockResolvedValue({ ...existingAddress, isDefault: true });

      const dto = { isDefault: false };

      await service.updateAddress(mockCustomer.id, addressId, dto as any);

      expect(mockManager.save).toHaveBeenCalledWith(
        CustomerAddress,
        expect.objectContaining({ isDefault: true }),
      );
    });
  });

  describe('setDefaultAddress', () => {
    let mockManager: any;
    let mockQueryBuilder: any;
    const addressId = 'addr-uuid-target-1';

    beforeEach(() => {
      mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      mockManager = {
        save: jest.fn().mockImplementation((entityClass, data) => Promise.resolve(data)),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      };

      customerRepository.manager.transaction.mockImplementation((cb: any) =>
        cb(mockManager),
      );
    });

    it('debe retornar la dirección directamente sin ejecutar transacción si ya era la dirección principal (idempotente)', async () => {
      const alreadyDefaultAddress = {
        id: addressId,
        customerId: mockCustomer.id,
        isDefault: true,
        label: 'Casa',
        department: { id: 1, name: 'San Salvador' },
        district: { id: 187, name: 'Mejicanos' },
      };

      addressRepository.findOne.mockResolvedValue(alreadyDefaultAddress);

      const result = await service.setDefaultAddress(mockCustomer.id, addressId);

      expect(addressRepository.findOne).toHaveBeenCalledWith({
        where: { id: addressId, customerId: mockCustomer.id },
        relations: ['department', 'district'],
      });
      // No ejecuta transacción de base de datos ni escrituras innecesarias
      expect(customerRepository.manager.transaction).not.toHaveBeenCalled();
      expect(result).toBe(alreadyDefaultAddress);
      expect(result.isDefault).toBe(true);
    });

    it('debe desmarcar en transacción las restantes y marcar la dirección solicitada como principal si no lo era', async () => {
      const nonDefaultAddress = {
        id: addressId,
        customerId: mockCustomer.id,
        isDefault: false,
        label: 'Trabajo',
      };

      addressRepository.findOne.mockResolvedValue(nonDefaultAddress);
      mockManager.findOne.mockResolvedValue({
        ...nonDefaultAddress,
        isDefault: true,
        department: { id: 1, name: 'San Salvador' },
        district: { id: 187, name: 'Mejicanos' },
      });

      const result = await service.setDefaultAddress(mockCustomer.id, addressId);

      expect(customerRepository.manager.transaction).toHaveBeenCalled();
      // Desmarca cualquier otra default previa
      expect(mockManager.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(CustomerAddress);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ isDefault: false });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'customer_id = :customerId AND is_default = true AND deleted_at IS NULL',
        { customerId: mockCustomer.id },
      );
      // Guarda la dirección como principal
      expect(mockManager.save).toHaveBeenCalledWith(
        CustomerAddress,
        expect.objectContaining({
          id: addressId,
          isDefault: true,
        }),
      );
      expect(result.isDefault).toBe(true);
    });

    it('debe lanzar NotFoundException con código ADDRESS_NOT_FOUND si la dirección no existe o no pertenece al cliente', async () => {
      addressRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setDefaultAddress(mockCustomer.id, 'non-existent-or-alien-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeAddress', () => {
    let mockManager: any;
    const addressId = 'addr-uuid-to-delete-1';

    beforeEach(() => {
      mockManager = {
        softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn(),
        save: jest.fn().mockImplementation((entityClass, data) => Promise.resolve(data)),
      };

      customerRepository.manager.transaction.mockImplementation((cb: any) =>
        cb(mockManager),
      );
    });

    it('debe eliminar una dirección que NO es default sin modificar otras direcciones (newDefaultAddress = null)', async () => {
      const nonDefaultAddress = {
        id: addressId,
        customerId: mockCustomer.id,
        isDefault: false,
      };

      addressRepository.findOne.mockResolvedValue(nonDefaultAddress);

      const result = await service.removeAddress(mockCustomer.id, addressId);

      expect(addressRepository.findOne).toHaveBeenCalledWith({
        where: { id: addressId, customerId: mockCustomer.id },
      });
      expect(mockManager.softDelete).toHaveBeenCalledWith(CustomerAddress, addressId);
      // Como no era default, no busca ninguna otra para reasignar
      expect(mockManager.findOne).not.toHaveBeenCalled();
      expect(result).toEqual({
        deletedAddressId: addressId,
        newDefaultAddress: null,
      });
    });

    it('debe reasignar determinísticamente como default la dirección más reciente restante si la eliminada era default', async () => {
      const defaultAddress = {
        id: addressId,
        customerId: mockCustomer.id,
        isDefault: true,
      };

      const remainingAddress = {
        id: 'addr-uuid-remaining-2',
        customerId: mockCustomer.id,
        isDefault: false,
        createdAt: new Date('2026-09-08T15:00:00Z'),
        department: { id: 1, name: 'San Salvador' },
        district: { id: 187, name: 'Mejicanos' },
      };

      addressRepository.findOne.mockResolvedValue(defaultAddress);
      mockManager.findOne.mockResolvedValue(remainingAddress);

      const result = await service.removeAddress(mockCustomer.id, addressId);

      expect(mockManager.softDelete).toHaveBeenCalledWith(CustomerAddress, addressId);
      // Criterio determinístico: más reciente (createdAt DESC, id ASC)
      expect(mockManager.findOne).toHaveBeenCalledWith(CustomerAddress, {
        where: { customerId: mockCustomer.id, deletedAt: expect.anything() },
        relations: ['department', 'district'],
        order: { createdAt: 'DESC', id: 'ASC' },
      });
      expect(mockManager.save).toHaveBeenCalledWith(
        CustomerAddress,
        expect.objectContaining({
          id: 'addr-uuid-remaining-2',
          isDefault: true,
        }),
      );
      expect(result.deletedAddressId).toBe(addressId);
      expect(result.newDefaultAddress?.id).toBe('addr-uuid-remaining-2');
      expect(result.newDefaultAddress?.isDefault).toBe(true);
    });

    it('debe permitir cero defaults si la eliminada era default y no quedan más direcciones del cliente', async () => {
      const defaultAddress = {
        id: addressId,
        customerId: mockCustomer.id,
        isDefault: true,
      };

      addressRepository.findOne.mockResolvedValue(defaultAddress);
      mockManager.findOne.mockResolvedValue(null); // No quedan direcciones activas

      const result = await service.removeAddress(mockCustomer.id, addressId);

      expect(mockManager.softDelete).toHaveBeenCalledWith(CustomerAddress, addressId);
      expect(mockManager.findOne).toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
      expect(result).toEqual({
        deletedAddressId: addressId,
        newDefaultAddress: null,
      });
    });

    it('debe lanzar NotFoundException con código ADDRESS_NOT_FOUND si la dirección no existe o pertenece a otro cliente', async () => {
      addressRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeAddress(mockCustomer.id, 'unknown-or-alien-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
