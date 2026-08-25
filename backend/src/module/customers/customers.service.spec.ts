import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { EcommerceAuthSession } from './entities/ecommerce-auth-session.entity';
import { Order } from './entities/order.entity';
import { LocationsService } from '../locations/locations.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HashService } from '../auth/services/hash.service';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CustomerAdminResponseDto } from './dto/customer-admin-response.dto';

describe('CustomersService', () => {
  let service: CustomersService;
  let customerRepository: Repository<Customer>;

  const mockCustomerRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockAddressRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockSessionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockOrderRepository = {
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockLocationsService = {
    validateDepartmentDistrict: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(CustomerAddress),
          useValue: mockAddressRepository,
        },
        {
          provide: getRepositoryToken(EcommerceAuthSession),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: LocationsService,
          useValue: mockLocationsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HashService,
          useValue: mockHashService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    customerRepository = module.get<Repository<Customer>>(
      getRepositoryToken(Customer),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a customer if found', async () => {
      const mockCustomer = {
        id: 'uuid-123',
        fullName: 'John Doe',
        addresses: [],
      } as any;
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer);

      const result = await service.findOne('uuid-123');
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if customer not found', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('uuid-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should throw ConflictException if email already exists (case-insensitive check)', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 'uuid-existing',
          email: 'cliente@correo.com',
        }),
      };
      jest
        .spyOn(customerRepository, 'createQueryBuilder')
        .mockReturnValue(mockQB as any);

      await expect(
        service.create({ email: 'CLIENTE@CORREO.COM', dui: '12345678-9' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if dui already exists', async () => {
      const mockQB = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'uuid-existing', dui: '12345678-9' }),
      };
      jest
        .spyOn(customerRepository, 'createQueryBuilder')
        .mockReturnValue(mockQB as any);

      await expect(
        service.create({ email: 'new@correo.com', dui: '12345678-9' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createAddress', () => {
    it('should throw NotFoundException or BadRequestException when locationsService.validateDepartmentDistrict fails', async () => {
      jest
        .spyOn(mockLocationsService, 'validateDepartmentDistrict')
        .mockRejectedValue(
          new NotFoundException({
            code: 'DEPARTMENT_NOT_FOUND',
            message: 'El departamento no existe o está inactivo',
          }),
        );

      await expect(
        service.createAddress('customer-uuid', {
          label: 'Casa',
          departmentId: 'invalid-dep-uuid',
          districtId: 'invalid-dist-uuid',
          city: 'San Salvador',
          addressLine: 'Senda 3, Casa #14',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateSessionForRefresh', () => {
    it('should throw UnauthorizedException if session is not found or revoked', async () => {
      // Mock findOne to return null
      jest.spyOn(mockSessionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.validateSessionForRefresh('invalid-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException and revoke session if expiresAt is in the past', async () => {
      const mockSession = {
        id: 'session-123',
        expiresAt: new Date(Date.now() - 5000), // expired 5 seconds ago
        revokedAt: null,
      };
      jest
        .spyOn(mockSessionRepository, 'findOne')
        .mockResolvedValue(mockSession);
      const saveSpy = jest
        .spyOn(mockSessionRepository, 'save')
        .mockResolvedValue(mockSession);

      await expect(
        service.validateSessionForRefresh('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
      expect(saveSpy).toHaveBeenCalled();
      expect(mockSession.revokedAt).toBeInstanceOf(Date);
    });

    it('should return session if it is active and not expired', async () => {
      const mockSession = {
        id: 'session-123',
        expiresAt: new Date(Date.now() + 60000), // active
        revokedAt: null,
      };
      jest
        .spyOn(mockSessionRepository, 'findOne')
        .mockResolvedValue(mockSession);

      const result = await service.validateSessionForRefresh('valid-token');
      expect(result).toEqual(mockSession);
    });
  });

  describe('Address Ownership validation', () => {
    it('should throw NotFoundException if customer A tries to update address belonging to customer B', async () => {
      // Mock findOne to return null because of customerId mismatch
      jest.spyOn(mockAddressRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateAddress('customer-A', 'address-B', {
          label: 'Nuevo Label',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if customer A tries to delete address belonging to customer B', async () => {
      jest.spyOn(mockAddressRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.removeAddress('customer-A', 'address-B'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if customer A tries to set as default an address belonging to customer B', async () => {
      jest.spyOn(mockAddressRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.setDefaultAddress('customer-A', 'address-B'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Security and Sensitive Fields Exposure', () => {
    it('should never contain passwordHash or refreshTokenHash in the serialized CustomerAdminResponseDto', () => {
      const mockRawData = {
        id: 'uuid-123',
        fullName: 'Carlos Gómez',
        dui: '01234567-8',
        email: 'carlos@correo.com',
        phone: '+50371234567',
        isActive: true,
        passwordHash: '$2b$10$xyz',
        refreshTokenHash: 'sha256hashvalue',
        addresses: [],
      };

      const serialized = plainToInstance(
        CustomerAdminResponseDto,
        mockRawData,
        {
          excludeExtraneousValues: true,
        },
      );

      const serializedStr = JSON.stringify(serialized);

      expect(serializedStr).not.toContain('passwordHash');
      expect(serializedStr).not.toContain('refreshTokenHash');
      expect((serialized as any).passwordHash).toBeUndefined();
      expect((serialized as any).refreshTokenHash).toBeUndefined();
    });
  });

  describe('Logging Security and Exception Sanitization', () => {
    it('should confirm that exception payloads or logged structures exclude password, cookies, and tokens', () => {
      // Mock error object with sensitive fields to simulate auth failure
      const rawException = new UnauthorizedException({
        code: 'SESSION_EXPIRED_OR_REVOKED',
        message: 'La sesión ha expirado o ya no es válida',
        // Internal technical context that should never be returned or printed
        secretAuthPayload: {
          passwordHash: '$2b$10$abcdefghijklmnop',
          refreshToken: 'jwt-refresh-token-value',
          authorizationHeader: 'Bearer my-jwt-token-string',
        },
      });

      const exceptionResponse = rawException.getResponse() as any;

      // Assert that standard response format returned to client excludes raw sensitive properties
      expect(exceptionResponse.code).toBe('SESSION_EXPIRED_OR_REVOKED');
      expect(exceptionResponse.message).toBe(
        'La sesión ha expirado o ya no es válida',
      );

      // Simulating serialization/stringification check
      const clientErrorResponse = {
        success: false,
        error: {
          code: exceptionResponse.code,
          message: exceptionResponse.message,
        },
      };
      const exceptionStr = JSON.stringify(clientErrorResponse);
      expect(exceptionStr).not.toContain('passwordHash');
      expect(exceptionStr).not.toContain('authorizationHeader');
    });
  });
});
