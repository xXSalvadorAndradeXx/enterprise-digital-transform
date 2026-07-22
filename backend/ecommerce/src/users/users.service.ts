import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
}
