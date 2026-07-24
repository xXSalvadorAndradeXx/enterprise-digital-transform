import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsService } from './permissions.service';
import { Permission } from '../users/entities/permission.entity';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let repository: Repository<Permission>;

  const mockPermissionRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    repository = module.get<Repository<Permission>>(getRepositoryToken(Permission));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe retornar los permisos agrupados por recurso en formato array', async () => {
      const mockPermissions = [
        { id: '1', code: 'users:create', description: 'Crear usuarios' },
        { id: '2', code: 'users:read', description: 'Leer usuarios' },
        { id: '3', code: 'roles:create', description: 'Crear roles' },
      ];

      mockPermissionRepository.find.mockResolvedValue(mockPermissions);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          resource: 'users',
          permissions: [
            { id: '1', code: 'users:create', description: 'Crear usuarios' },
            { id: '2', code: 'users:read', description: 'Leer usuarios' },
          ],
        },
        {
          resource: 'roles',
          permissions: [
            { id: '3', code: 'roles:create', description: 'Crear roles' },
          ],
        },
      ]);
      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
        order: { code: 'ASC' },
      });
    });
  });
});
