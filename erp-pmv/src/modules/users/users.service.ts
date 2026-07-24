// src/modules/users/users.service.ts
import {
  Injectable, NotFoundException,
  ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El email ya está registrado');

    // Contraseña temporal — el usuario deberá cambiarla en el primer login
    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const roles = dto.roleIds?.length
      ? await this.resolveRoles(dto.roleIds)
      : [];

    const user = this.userRepo.create({
      firstName:          dto.firstName,
      lastName:           dto.lastName,
      email:              dto.email,
      passwordHash,
      mustChangePassword: true,
      roles,
    });

    const saved = await this.userRepo.save(user);

    // Devolvemos la contraseña temporal solo en la creación
    // El canal de entrega (email) va en una fase posterior
    return Object.assign(saved, { tempPassword });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const dup = await this.userRepo.findOne({ where: { email: dto.email } });
      if (dup) throw new ConflictException('El email ya está en uso');
      user.email = dto.email;
    }

    if (dto.firstName)  user.firstName = dto.firstName;
    if (dto.lastName)   user.lastName  = dto.lastName;

    if (dto.roleIds !== undefined) {
      user.roles = await this.resolveRoles(dto.roleIds ?? []);
    }

    return this.userRepo.save(user);
  }

  async assignRoles(id: string, dto: AssignRolesDto): Promise<User> {
    const user = await this.findOne(id);

    // Proteger el último SUPERADMIN activo
    await this.guardLastSuperadmin(user, dto.roleIds);

    user.roles = await this.resolveRoles(dto.roleIds);
    return this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.guardLastSuperadmin(user, []);
    await this.userRepo.softDelete(id);
  }

  // ── Helpers privados ────────────────────────────────────────────────────

  private async resolveRoles(ids: string[]): Promise<Role[]> {
    return Promise.all(
      ids.map(async (rid) => {
        const role = await this.roleRepo.findOne({ where: { id: rid } });
        if (!role) throw new NotFoundException(`Rol ${rid} no encontrado`);
        return role;
      }),
    );
  }

  private async guardLastSuperadmin(
    user: User,
    incomingRoleIds: string[],
  ): Promise<void> {
    const isSuperadmin = user.roles?.some((r) => r.name === 'SUPERADMIN');
    if (!isSuperadmin) return;

    const willKeepSuperadmin = incomingRoleIds.length > 0
      ? await this.roleRepo
          .createQueryBuilder('role')
          .where('role.id IN (:...ids)', { ids: incomingRoleIds })
          .andWhere('role.name = :name', { name: 'SUPERADMIN' })
          .getCount()
          .then((c) => c > 0)
      : false;

    if (willKeepSuperadmin) return;

    // Contar cuántos usuarios activos con SUPERADMIN quedan
    const superadmins = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r')
      .where('r.name = :name', { name: 'SUPERADMIN' })
      .andWhere('u.is_active = true')
      .andWhere('u.deleted_at IS NULL')
      .getCount();

    if (superadmins <= 1) {
      throw new ForbiddenException(
        'No se puede remover el rol SUPERADMIN del último administrador activo',
      );
    }
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    return Array.from({ length: 12 }, () =>
      chars[Math.floor(Math.random() * chars.length)],
    ).join('');
  }
}