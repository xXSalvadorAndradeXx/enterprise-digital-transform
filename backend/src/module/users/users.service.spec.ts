import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';
import { RefreshTokenService } from '../auth/services/refresh-token.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    save: jest.fn(),
    softRemove: jest.fn(),
    create: jest.fn((data) => ({ ...data })),
    query: jest.fn(),
  };

  const mockRoleRepository = {
    findBy: jest.fn(),
  };

  const mockEntityManager = {
    getRepository: jest.fn((entity) => {
      if (entity === User) return mockUserRepository;
      if (entity === Role) return mockRoleRepository;
      return null;
    }),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb(mockEntityManager)),
  };

  const mockRefreshTokenService = {
    revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear un usuario exitosamente con contraseña temporal hasheada', async () => {
      const createUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roleIds: ['role-uuid'],
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findBy.mockResolvedValue([{ id: 'role-uuid', name: 'CLIENTE' }]);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve({ id: 'new-user-uuid', ...user }));
      mockUserRepository.query.mockResolvedValue([]);

      const result = await service.create(createUserDto);

      expect(result.user.email).toBe(createUserDto.email);
      expect(result.user.firstName).toBe(createUserDto.firstName);
      expect(result.user.lastName).toBe(createUserDto.lastName);
      expect(result.user.mustChangePassword).toBe(true);
      expect(result.temporaryPassword).toBeDefined();
      expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(12);

      // Verificar que se hasheó con bcrypt
      const isMatch = await bcrypt.compare(result.temporaryPassword, result.user.passwordHash);
      expect(isMatch).toBe(true);

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockUserRepository.query).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el correo electrónico ya existe', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-id' } as User);

      await expect(
        service.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          roleIds: ['role-uuid'],
        })
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar NotFoundException si algún rol especificado no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findBy.mockResolvedValue([]); // No se encuentra el rol

      await expect(
        service.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          roleIds: ['role-uuid'],
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('isLastActiveSuperadmin', () => {
    it('debe retornar true si el usuario es el único SUPERADMIN activo', async () => {
      const mockUser = {
        id: 'user-uuid',
        isActive: true,
        roles: [{ name: 'SUPERADMIN' }],
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await service.isLastActiveSuperadmin('user-uuid');

      expect(result).toBe(true);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid', isActive: true },
        relations: ['roles'],
      });
      expect(mockQueryBuilder.getCount).toHaveBeenCalled();
    });

    it('debe retornar false si hay múltiples SUPERADMIN activos', async () => {
      const mockUser = {
        id: 'user-uuid',
        isActive: true,
        roles: [{ name: 'SUPERADMIN' }],
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockQueryBuilder.getCount.mockResolvedValue(3); // Varios superadmins activos

      const result = await service.isLastActiveSuperadmin('user-uuid');

      expect(result).toBe(false);
    });

    it('debe retornar false si el usuario evaluado no tiene el rol de SUPERADMIN', async () => {
      const mockUser = {
        id: 'user-uuid',
        isActive: true,
        roles: [{ name: 'CLIENTE' }], // Sin rol SUPERADMIN
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.isLastActiveSuperadmin('user-uuid');

      expect(result).toBe(false);
      expect(mockQueryBuilder.getCount).not.toHaveBeenCalled();
    });

    it('debe retornar false si el usuario evaluado está inactivo o no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // Usuario inactivo o no existe

      const result = await service.isLastActiveSuperadmin('user-uuid');

      expect(result).toBe(false);
      expect(mockQueryBuilder.getCount).not.toHaveBeenCalled();
    });
  });

  describe('assignRoles (protección de SUPERADMIN)', () => {
    it('debe lanzar ConflictException al intentar remover el rol SUPERADMIN del último administrador activo', async () => {
      const mockUser = {
        id: 'user-uuid',
        isActive: true,
        roles: [{ name: 'SUPERADMIN' }],
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockQueryBuilder.getCount.mockResolvedValue(1); // Es el último activo

      const newRoles = [{ id: 'role-client-uuid', name: 'CLIENTE' }] as Role[];
      mockRoleRepository.findBy.mockResolvedValue(newRoles);

      await expect(
        service.assignRoles('user-uuid', { roleIds: ['role-client-uuid'] }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe permitir asignar roles si no se remueve SUPERADMIN o no es el último activo', async () => {
      const mockUser = {
        id: 'user-uuid',
        isActive: true,
        roles: [{ name: 'SUPERADMIN' }],
      } as User;

      let userState = { ...mockUser };
      mockUserRepository.findOne.mockImplementation(() => Promise.resolve(userState));
      mockQueryBuilder.getCount.mockResolvedValue(2); // Hay otro activo, por ende se le permite cambiar

      const newRoles = [{ id: 'role-client-uuid', name: 'CLIENTE', permissions: [] }] as unknown as Role[];
      mockRoleRepository.findBy.mockResolvedValue(newRoles);
      mockUserRepository.save.mockImplementation((user) => {
        userState = { ...user };
        return Promise.resolve(userState);
      });

      const result = await service.assignRoles('user-uuid', { roleIds: ['role-client-uuid'] });

      expect(result.roles).toEqual(newRoles);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debe actualizar los datos básicos del usuario exitosamente', async () => {
      const mockUser = {
        id: 'user-uuid',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: [{ name: 'CLIENTE' }],
      } as User;

      mockUserRepository.findOne.mockImplementation(({ where }) => {
        if (where.id === 'user-uuid') return Promise.resolve(mockUser);
        return Promise.resolve(null);
      });
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

      const result = await service.update('user-uuid', {
        firstName: 'Johnny',
        lastName: 'Smith',
        email: 'johnny@example.com',
      });

      expect(result.firstName).toBe('Johnny');
      expect(result.lastName).toBe('Smith');
      expect(result.email).toBe('johnny@example.com');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el email a actualizar ya existe', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'john@example.com',
      } as User;

      mockUserRepository.findOne.mockImplementation(({ where }) => {
        if (where.id === 'user-uuid') return Promise.resolve(mockUser);
        if (where.email === 'duplicate@example.com') return Promise.resolve({ id: 'other-uuid' } as User);
        return Promise.resolve(null);
      });

      await expect(
        service.update('user-uuid', { email: 'duplicate@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si la actualización remueve el rol SUPERADMIN del último administrador activo', async () => {
      const mockUser = {
        id: 'user-uuid',
        isActive: true,
        roles: [{ name: 'SUPERADMIN' }],
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockQueryBuilder.getCount.mockResolvedValue(1); // Es el último activo

      const newRoles = [{ id: 'role-client-uuid', name: 'CLIENTE' }] as Role[];
      mockRoleRepository.findBy.mockResolvedValue(newRoles);

      await expect(
        service.update('user-uuid', { roleIds: ['role-client-uuid'] }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe desactivar un usuario si no viola la protección del último SUPERADMIN', async () => {
      const mockUser = {
        id: 'user-uuid',
        isActive: true,
        roles: [{ name: 'CLIENTE' }],
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

      const result = await service.update('user-uuid', { isActive: false });

      expect(result.isActive).toBe(false);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si se intenta desactivar al último SUPERADMIN activo', async () => {
      const mockUser = {
        id: 'user-uuid',
        isActive: true,
        roles: [{ name: 'SUPERADMIN' }],
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockQueryBuilder.getCount.mockResolvedValue(1); // Es el último activo

      await expect(
        service.update('user-uuid', { isActive: false })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove (protección de SUPERADMIN)', () => {
    it('debe lanzar ConflictException al intentar eliminar al último SUPERADMIN activo', async () => {
      const mockUser = {
        id: 'user-uuid',
        isActive: true,
        roles: [{ name: 'SUPERADMIN' }],
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockQueryBuilder.getCount.mockResolvedValue(1); // Es el último activo

      await expect(service.remove('user-uuid')).rejects.toThrow(ConflictException);
    });

    it('debe permitir la desactivación y softRemove si no es el último SUPERADMIN activo', async () => {
      const mockUser = {
        id: 'user-uuid',
        isActive: true,
        roles: [{ name: 'SUPERADMIN' }],
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockQueryBuilder.getCount.mockResolvedValue(2); // Hay más de uno activo
      mockUserRepository.save.mockResolvedValue({ ...mockUser, isActive: false });
      mockUserRepository.softRemove.mockResolvedValue({ ...mockUser, isActive: false, deletedAt: new Date() });

      const result = await service.remove('user-uuid');

      expect(result.isActive).toBe(false);
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockUserRepository.softRemove).toHaveBeenCalled();
      expect(mockRefreshTokenService.revokeAllUserTokens).toHaveBeenCalledWith('user-uuid');
    });
  });
});
