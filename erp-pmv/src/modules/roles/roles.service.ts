// src/modules/roles/roles.service.ts
import {
  Injectable, NotFoundException,
  ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/dto/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({ withDeleted: false });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException(`Rol ${id} no encontrado`);
    return role;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Ya existe un rol con ese nombre');

    const permissions = await this.resolvePermissions(dto.permissionIds);

    const role = this.roleRepo.create({
      name:        dto.name,
      description: dto.description ?? null,
      permissions,
    });

    return this.roleRepo.save(role);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ForbiddenException('Los roles de sistema no son editables');
    }

    if (dto.name && dto.name !== role.name) {
      const dup = await this.roleRepo.findOne({ where: { name: dto.name } });
      if (dup) throw new ConflictException('Ya existe un rol con ese nombre');
      role.name = dto.name;
    }

    if (dto.description !== undefined) role.description = dto.description ?? null;

    if (dto.permissionIds) {
      role.permissions = await this.resolvePermissions(dto.permissionIds);
    }

    return this.roleRepo.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new ForbiddenException('No se puede eliminar un rol de sistema');
    }

    await this.roleRepo.softDelete(id);
  }

  private async resolvePermissions(ids: string[]): Promise<Permission[]> {
    const permissions = await Promise.all(
      ids.map((pid) =>
        this.permissionRepo.findOne({ where: { id: pid } }).then((p) => {
          if (!p) throw new NotFoundException(`Permiso ${pid} no encontrado`);
          return p;
        }),
      ),
    );
    return permissions;
  }
}