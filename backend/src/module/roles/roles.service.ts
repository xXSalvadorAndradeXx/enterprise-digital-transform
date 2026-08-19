import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Role } from '../users/entities/role.entity';
import { Permission } from '../users/entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .loadRelationCountAndMap('role.userCount', 'role.users')
      .loadRelationCountAndMap('role.permissionCount', 'role.permissions')
      .getMany();
  }

  async findOneWithCounts(id: string, manager?: any): Promise<Role> {
    const repo = manager ? manager.getRepository(Role) : this.roleRepository;
    const role = await repo.createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .loadRelationCountAndMap('role.userCount', 'role.users')
      .loadRelationCountAndMap('role.permissionCount', 'role.permissions')
      .where('role.id = :id', { id })
      .getOne();

    if (!role) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return role;
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const normalizedName = createRoleDto.name.trim().toUpperCase();

    return this.dataSource.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const permissionRepo = manager.getRepository(Permission);

      // 1. Verificar si el rol ya existe
      const existing = await roleRepo.findOne({ where: { name: normalizedName } });
      if (existing) {
        throw new ConflictException(`El rol con nombre "${normalizedName}" ya existe`);
      }

      // 2. Buscar y validar los permisos si se especificaron
      let permissions: Permission[] = [];
      if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
        permissions = await permissionRepo.findBy({ id: In(createRoleDto.permissionIds) });
        if (permissions.length !== createRoleDto.permissionIds.length) {
          throw new NotFoundException('Uno o más permisos especificados no fueron encontrados');
        }
      }

      // 3. Crear e insertar el nuevo rol
      const role = roleRepo.create({
        name: normalizedName,
        description: createRoleDto.description || null,
        isSystem: false, // Por defecto, roles creados dinámicamente no son de sistema
        permissions,
      });

      const saved = await roleRepo.save(role);
      return this.findOneWithCounts(saved.id, manager);
    });
  }

  async update(id: string, updateRoleDto: CreateRoleDto): Promise<Role> {
    return this.dataSource.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);
      const permissionRepo = manager.getRepository(Permission);

      // 1. Buscar el rol incluyendo la relación de permisos
      const role = await roleRepo.findOne({
        where: { id },
        relations: ['permissions'],
      });

      if (!role) {
        throw new NotFoundException(`Rol con ID ${id} no encontrado`);
      }

      // 2. Bloquear edición si es un rol de sistema (isSystem === true)
      if (role.isSystem) {
        throw new ForbiddenException('Los roles de sistema no pueden ser editados');
      }

      // 3. Validar unicidad del nombre si se va a actualizar
      if (updateRoleDto.name) {
        const normalizedName = updateRoleDto.name.trim().toUpperCase();
        if (normalizedName !== role.name) {
          const existing = await roleRepo.findOne({ where: { name: normalizedName } });
          if (existing) {
            throw new ConflictException(`El rol con nombre "${normalizedName}" ya existe`);
          }
          role.name = normalizedName;
        }
      }

      // 4. Actualizar descripción
      if (updateRoleDto.description !== undefined) {
        role.description = updateRoleDto.description || null;
      }

      // 5. Actualizar relación de permisos
      if (updateRoleDto.permissionIds) {
        const permissions = await permissionRepo.findBy({ id: In(updateRoleDto.permissionIds) });
        if (permissions.length !== updateRoleDto.permissionIds.length) {
          throw new NotFoundException('Uno o más permisos especificados no fueron encontrados');
        }
        role.permissions = permissions;
      }

      await roleRepo.save(role);
      return this.findOneWithCounts(id, manager);
    });
  }

  async remove(id: string): Promise<Role> {
    return this.dataSource.transaction(async (manager) => {
      const roleRepo = manager.getRepository(Role);

      // 1. Buscar el rol incluyendo la relación con usuarios para el conteo
      const role = await roleRepo.findOne({
        where: { id },
        relations: ['users'],
      });

      if (!role) {
        throw new NotFoundException(`Rol con ID ${id} no encontrado`);
      }

      // 2. Bloquear eliminación si el rol es de sistema
      if (role.isSystem) {
        throw new ConflictException('No se puede eliminar un rol de sistema');
      }

      // 3. Bloquear eliminación si el rol tiene usuarios asignados
      if (role.users && role.users.length > 0) {
        throw new ConflictException('No se puede eliminar un rol que tiene usuarios asignados');
      }

      // 4. Aplicar soft delete
      return roleRepo.softRemove(role);
    });
  }
}
