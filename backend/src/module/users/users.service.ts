import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { generateTemporaryPassword } from '../../common/utils/security.util';
import { RefreshTokenService } from '../auth/services/refresh-token.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // 1. Verificar si el email ya está registrado
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // 2. Buscar los roles correspondientes a los IDs del DTO
    const roles = await this.roleRepository.findBy({ id: In(createUserDto.roleIds) });
    if (roles.length !== createUserDto.roleIds.length) {
      throw new NotFoundException('Uno o más roles especificados no fueron encontrados');
    }

    // 3. Generar contraseña temporal segura
    const temporaryPassword = generateTemporaryPassword(12);

    // 4. Hashear la contraseña temporal con bcrypt (salt rounds = 10)
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // 5. Instanciar y rellenar campos requeridos de User
    const user = this.userRepository.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      passwordHash,
      isActive: true,
      mustChangePassword: true,
      failedLoginAttempts: 0,
      roles,
    });

    const savedUser = await this.userRepository.save(user);

    // 6. Crear carrito de compras inicial para el nuevo usuario
    await this.userRepository.query(
      `INSERT INTO "carts" ("userId") VALUES ($1) ON CONFLICT ("userId") DO NOTHING`,
      [savedUser.id],
    );

    // 7. Punto de integración Mock para envío de notificación al usuario
    this.logger.log(
      `[NOTIFICACIÓN MOCK] Enviar contraseña temporal a ${savedUser.email}. Contraseña temporal: ${temporaryPassword}`
    );

    return {
      user: savedUser,
      temporaryPassword,
    };
  }

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
    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const roleRepo = manager.getRepository(Role);

      const user = await userRepo.findOne({
        where: { id: userId },
        relations: ['roles'],
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      // Buscar los roles correspondientes a los IDs del DTO
      const roles = await roleRepo.findBy({ id: In(assignRolesDto.roleIds) });
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
      await userRepo.save(user);
    });

    return this.findOne(userId);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // 1. Si se actualiza el email, verificar unicidad
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      user.email = updateUserDto.email;
    }

    if (updateUserDto.firstName !== undefined) {
      user.firstName = updateUserDto.firstName;
    }

    if (updateUserDto.lastName !== undefined) {
      user.lastName = updateUserDto.lastName;
    }

    // 2. Si se actualiza el estado activo
    if (updateUserDto.isActive !== undefined && updateUserDto.isActive !== user.isActive) {
      if (updateUserDto.isActive === false) {
        const isLastSuper = await this.isLastActiveSuperadmin(id);
        if (isLastSuper) {
          throw new ConflictException(
            'Operación rechazada: No se puede desactivar al último administrador activo en el sistema.'
          );
        }
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await this.refreshTokenService.revokeAllUserTokens(id);
      }
      user.isActive = updateUserDto.isActive;
    }

    // 3. Si se actualizan los roles, verificar la protección del último SUPERADMIN activo
    if (updateUserDto.roleIds) {
      const roles = await this.roleRepository.findBy({ id: In(updateUserDto.roleIds) });
      if (roles.length !== updateUserDto.roleIds.length) {
        throw new NotFoundException('Uno o más roles especificados no fueron encontrados');
      }

      const isLastSuper = await this.isLastActiveSuperadmin(id);
      if (isLastSuper) {
        const containsSuperAdmin = roles.some((role) => role.name === 'SUPERADMIN');
        if (!containsSuperAdmin) {
          throw new ConflictException(
            'Operación rechazada: No se puede remover el rol SUPERADMIN del último administrador activo en el sistema.'
          );
        }
      }
      user.roles = roles;
    }

    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const removedUser = await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);

      const user = await userRepo.findOne({ where: { id } });
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
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await userRepo.save(user);
      return userRepo.softRemove(user);
    });

    // Invocar revocación de refresh tokens de forma inmediata tras desactivar/eliminar
    await this.refreshTokenService.revokeAllUserTokens(id);

    return removedUser;
  }

  
  async generateTemporaryPassword(id: string): Promise<{ temporaryPassword: string }> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const temporaryPassword = generateTemporaryPassword(12);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    user.passwordHash = passwordHash;
    user.mustChangePassword = true;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.isBlocked = false;

    await this.userRepository.save(user);

    this.logger.log(
      `[TEMPORARY PASSWORD GENERATED] Contraseña temporal generada para usuario ${user.email}: ${temporaryPassword}`
    );

    return { temporaryPassword };
  }

  async unlockUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.isBlocked = false;
    user.isActive = true;

    return this.userRepository.save(user);
  }

  async unlockAndResetPassword(id: string): Promise<{ user: User; temporaryPassword: string }> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // 1. Lógica de desbloqueo
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.isBlocked = false;
    user.isActive = true;

    // 2. Generar contraseña temporal segura
    const temporaryPassword = generateTemporaryPassword(12);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    user.passwordHash = passwordHash;
    user.mustChangePassword = true;

    const savedUser = await this.userRepository.save(user);

    this.logger.log(
      `[TEMPORARY PASSWORD GENERATED] Contraseña temporal generada para usuario ${savedUser.email} (durante desbloqueo): ${temporaryPassword}`
    );

    return {
      user: savedUser,
      temporaryPassword,
    };
  }
}
