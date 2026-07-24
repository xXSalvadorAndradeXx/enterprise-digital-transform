import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from '../users/entities/role.entity';
import { Permission } from '../users/entities/permission.entity';
import { User } from '../users/entities/user.entity';

describe('RolesService', () => {
  let service: RolesService;
  let roleRepository: Repository<Role>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  const mockRoleRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    create: jest.fn((data) => ({ ...data })),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockPermissionRepository = {
    findBy: jest.fn(),
  };

  const mockEntityManager = {
    getRepository: jest.fn((entity) => {
      if (entity === Role) return mockRoleRepository;
      if (entity === Permission) return mockPermissionRepository;
      return null;
    }),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb(mockEntityManager)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe retornar la lista de roles con conteos mapeados', async () => {
      const mockRoles = [
        { id: '1', name: 'SUPERADMIN', description: 'Super Admin', userCount: 1, permissionCount: 15, permissions: [] },
        { id: '2', name: 'CLIENTE', description: 'Cliente', userCount: 10, permissionCount: 3, permissions: [] },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockRoles);

      const result = await service.findAll();

      expect(result).toEqual(mockRoles);
      expect(mockRoleRepository.createQueryBuilder).toHaveBeenCalledWith('role');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('role.permissions', 'permissions');
      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith('role.userCount', 'role.users');
      expect(mockQueryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith('role.permissionCount', 'role.permissions');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('findOneWithCounts', () => {
    it('debe retornar el rol con relaciones y conteos si existe', async () => {
      const mockRole = {
        id: 'role-uuid',
        name: 'EDITOR',
        userCount: 0,
        permissionCount: 2,
        permissions: [],
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockRole);

      const result = await service.findOneWithCounts('role-uuid');

      expect(result).toEqual(mockRole);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role.id = :id', { id: 'role-uuid' });
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el rol no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.findOneWithCounts('non-existent-uuid')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe crear un rol exitosamente con permisos asociados', async () => {
      const createRoleDto = {
        name: 'editor',
        description: 'Permite editar productos',
        permissionIds: ['perm-uuid-1', 'perm-uuid-2'],
      };

      const mockPermissions = [
        { id: 'perm-uuid-1', code: 'products:create' },
        { id: 'perm-uuid-2', code: 'products:update' },
      ];

      const expectedRole = {
        id: 'role-uuid',
        name: 'EDITOR',
        description: 'Permite editar productos',
        isSystem: false,
        permissions: mockPermissions,
      };

      mockRoleRepository.findOne.mockResolvedValue(null); // No duplicado
      mockPermissionRepository.findBy.mockResolvedValue(mockPermissions);
      mockRoleRepository.save.mockImplementation((role) => Promise.resolve({ id: 'role-uuid', ...role }));
      mockQueryBuilder.getOne.mockResolvedValue(expectedRole);

      const result = await service.create(createRoleDto);

      expect(result.name).toBe('EDITOR');
      expect(result.description).toBe('Permite editar productos');
      expect(result.isSystem).toBe(false);
      expect(result.permissions).toEqual(mockPermissions);
      expect(mockRoleRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el nombre del rol ya existe', async () => {
      const createRoleDto = {
        name: 'editor',
        description: 'Permite editar productos',
      };

      mockRoleRepository.findOne.mockResolvedValue({ id: 'existing-uuid', name: 'EDITOR' } as unknown as Role);

      await expect(
        service.create(createRoleDto)
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar NotFoundException si alguno de los permisos indicados no existe', async () => {
      const createRoleDto = {
        name: 'editor',
        permissionIds: ['non-existent-perm'],
      };

      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionRepository.findBy.mockResolvedValue([]); // No se encuentra el permiso

      await expect(
        service.create(createRoleDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe actualizar los datos de un rol exitosamente', async () => {
      const mockRole = {
        id: 'role-uuid',
        name: 'EDITOR',
        description: 'Permite editar productos',
        isSystem: false,
        permissions: [],
      } as unknown as Role;

      const expectedRole = {
        id: 'role-uuid',
        name: 'EDITOR-MODIFICADO',
        description: 'Nueva descripción',
        isSystem: false,
        permissions: [],
      };

      mockRoleRepository.findOne.mockImplementation(({ where }) => {
        if (where.id === 'role-uuid') return Promise.resolve(mockRole);
        return Promise.resolve(null);
      });
      mockRoleRepository.save.mockImplementation((role) => Promise.resolve(role));
      mockQueryBuilder.getOne.mockResolvedValue(expectedRole);

      const result = await service.update('role-uuid', {
        name: 'editor-modificado',
        description: 'Nueva descripción',
      });

      expect(result.name).toBe('EDITOR-MODIFICADO');
      expect(result.description).toBe('Nueva descripción');
      expect(mockRoleRepository.save).toHaveBeenCalled();
    });

    it('debe actualizar los permisos de un rol exitosamente', async () => {
      const mockRole = {
        id: 'role-uuid',
        name: 'EDITOR',
        isSystem: false,
        permissions: [],
      } as unknown as Role;

      const mockPermissions = [
        { id: 'perm-1', code: 'users:read' },
      ];

      const expectedRole = {
        id: 'role-uuid',
        name: 'EDITOR',
        isSystem: false,
        permissions: mockPermissions,
      };

      mockRoleRepository.findOne.mockImplementation(({ where }) => {
        if (where.id === 'role-uuid') return Promise.resolve(mockRole);
        return Promise.resolve(null);
      });
      mockPermissionRepository.findBy.mockResolvedValue(mockPermissions);
      mockRoleRepository.save.mockImplementation((role) => Promise.resolve(role));
      mockQueryBuilder.getOne.mockResolvedValue(expectedRole);

      const result = await service.update('role-uuid', {
        name: 'EDITOR',
        permissionIds: ['perm-1'],
      });

      expect(result.permissions).toEqual(mockPermissions);
      expect(mockRoleRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException al intentar actualizar un rol con permisos que no existen', async () => {
      const mockRole = {
        id: 'role-uuid',
        name: 'EDITOR',
        isSystem: false,
        permissions: [],
      } as unknown as Role;

      mockRoleRepository.findOne.mockImplementation(({ where }) => {
        if (where.id === 'role-uuid') return Promise.resolve(mockRole);
        return Promise.resolve(null);
      });
      mockPermissionRepository.findBy.mockResolvedValue([]); // No se encuentra el permiso

      await expect(
        service.update('role-uuid', { name: 'EDITOR', permissionIds: ['non-existent'] })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si el rol a actualizar no existe', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-uuid', { name: 'EDITOR' })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException al intentar editar un rol de sistema', async () => {
      const mockRole = {
        id: 'role-uuid',
        name: 'SUPERADMIN',
        isSystem: true,
      } as unknown as Role;

      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await expect(
        service.update('role-uuid', { name: 'NUEVO_SUPERADMIN' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar ConflictException si el nuevo nombre del rol ya existe', async () => {
      const mockRole = {
        id: 'role-uuid',
        name: 'EDITOR',
        isSystem: false,
      } as unknown as Role;

      mockRoleRepository.findOne.mockImplementation(({ where }) => {
        if (where.id === 'role-uuid') return Promise.resolve(mockRole);
        if (where.name === 'CLIENTE') return Promise.resolve({ id: 'client-uuid', name: 'CLIENTE' } as unknown as Role);
        return Promise.resolve(null);
      });

      await expect(
        service.update('role-uuid', { name: 'cliente' })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('debe aplicar soft delete si el rol no es de sistema y no tiene usuarios', async () => {
      const mockRole = {
        id: 'role-uuid',
        name: 'EDITOR',
        isSystem: false,
        users: [],
      } as unknown as Role;

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockRoleRepository.softRemove.mockResolvedValue({ ...mockRole, deletedAt: new Date() });

      const result = await service.remove('role-uuid');

      expect(result.deletedAt).toBeDefined();
      expect(mockRoleRepository.softRemove).toHaveBeenCalledWith(mockRole);
    });

    it('debe lanzar NotFoundException si el rol a eliminar no existe', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('non-existent-uuid')
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si el rol es de sistema', async () => {
      const mockRole = {
        id: 'role-uuid',
        name: 'SUPERADMIN',
        isSystem: true,
        users: [],
      } as unknown as Role;

      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await expect(
        service.remove('role-uuid')
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si el rol tiene usuarios asignados', async () => {
      const mockRole = {
        id: 'role-uuid',
        name: 'CLIENTE',
        isSystem: false,
        users: [{ id: 'user-uuid' } as User],
      } as unknown as Role;

      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await expect(
        service.remove('role-uuid')
      ).rejects.toThrow(ConflictException);
    });
  });
});
