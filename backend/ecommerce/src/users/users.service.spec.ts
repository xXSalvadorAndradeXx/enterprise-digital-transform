import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';

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
  };

  const mockRoleRepository = {
    findBy: jest.fn(),
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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));

    jest.clearAllMocks();
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

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockQueryBuilder.getCount.mockResolvedValue(2); // Hay otro activo, por ende se le permite cambiar

      const newRoles = [{ id: 'role-client-uuid', name: 'CLIENTE' }] as Role[];
      mockRoleRepository.findBy.mockResolvedValue(newRoles);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, roles: newRoles });

      const result = await service.assignRoles('user-uuid', { roleIds: ['role-client-uuid'] });

      expect(result.roles).toEqual(newRoles);
      expect(mockUserRepository.save).toHaveBeenCalled();
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
    });
  });
});
