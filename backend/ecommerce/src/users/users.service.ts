import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { AssignRolesDto } from './dto/assign-roles.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: { search?: string; email?: string; isActive?: boolean; roleId?: string },
  ) {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    if (filters) {
      if (filters.search) {
        queryBuilder.andWhere(
          '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }
      if (filters.email) {
        queryBuilder.andWhere('user.email ILIKE :email', { email: `%${filters.email}%` });
      }
      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
      }
      if (filters.roleId) {
        queryBuilder.andWhere('roles.id = :roleId', { roleId: filters.roleId });
      }
    }

    // Calcular offset (skip)
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Unificar el conjunto de todos los códigos de permisos de todos sus roles (sin duplicados)
    const permissionsSet = new Set<string>();
    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions) {
          for (const perm of role.permissions) {
            permissionsSet.add(perm.code);
          }
        }
      }
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      permissions: Array.from(permissionsSet),
    };
  }

  async isLastActiveSuperadmin(userId: string): Promise<boolean> {
    // 1. Verificar si el usuario que se está evaluando es un SUPERADMIN activo
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: ['roles'],
    });

    if (!user) {
      return false; // Si el usuario no existe o está inactivo, no califica
    }

    const isSuperAdmin = user.roles.some((role) => role.name === 'SUPERADMIN');
    if (!isSuperAdmin) {
      return false; // Si no tiene el rol de SUPERADMIN, tampoco califica
    }

    // 2. Contar cuántos usuarios activos tienen el rol SUPERADMIN en total
    const activeSuperadminsCount = await this.userRepository.createQueryBuilder('user')
      .innerJoin('user.roles', 'role', 'role.name = :roleName', { roleName: 'SUPERADMIN' })
      .where('user.isActive = :isActive', { isActive: true })
      .getCount();

    // 3. Si el total es exactamente 1, este usuario es el último superadmin activo
    return activeSuperadminsCount === 1;
  }

  async assignRoles(userId: string, assignRolesDto: AssignRolesDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Buscar los roles correspondientes a los IDs del DTO
    const roles = await this.roleRepository.findBy({ id: In(assignRolesDto.roleIds) });
    if (roles.length !== assignRolesDto.roleIds.length) {
      throw new NotFoundException('Uno o más roles especificados no fueron encontrados');
    }

    // Verificar si es el último SUPERADMIN activo en el sistema
    const isLastSuper = await this.isLastActiveSuperadmin(userId);
    if (isLastSuper) {
      const containsSuperAdmin = roles.some((role) => role.name === 'SUPERADMIN');
      if (!containsSuperAdmin) {
        throw new ConflictException(
          'Operación rechazada: No se puede remover el rol SUPERADMIN del último administrador activo en el sistema.'
        );
      }
    }

    user.roles = roles;
    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Bloquear si es el último SUPERADMIN activo
    const isLastSuper = await this.isLastActiveSuperadmin(id);
    if (isLastSuper) {
      throw new ConflictException(
        'Operación rechazada: No se puede eliminar o desactivar al último administrador activo en el sistema.'
      );
    }

    // Desactivar y aplicar soft-delete
    user.isActive = false;
    await this.userRepository.save(user);
    return this.userRepository.softRemove(user);
  }
}
