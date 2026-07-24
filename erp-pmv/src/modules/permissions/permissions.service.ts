import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './dto/permission.entity';
import { PermissionResponseDto } from './dto/permission-response.dto';

/**
 * PermissionsService — gestiona los permisos atómicos del sistema.
 * TDD § 4 Módulo Equipo — GET /permissions
 *
 * Los permisos se siembran en el seed inicial y son de solo lectura
 * desde la API (no se crean, editan ni eliminan via endpoints).
 */
@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Retorna todos los permisos disponibles agrupados por recurso.
   * TDD: GET /permissions — autorización: JWT + roles:read
   */
  async findAll(): Promise<Record<string, PermissionResponseDto[]>> {
    const permissions = await this.permissionRepository.find({
      order: { code: 'ASC' },
    });

    return this.groupByResource(permissions);
  }

  /**
   * Retorna todos los permisos como array plano.
   * Usado internamente por RolesService y seeds.
   */
  async findAllFlat(): Promise<Permission[]> {
    return this.permissionRepository.find({ order: { code: 'ASC' } });
  }

  /**
   * Busca permisos por sus IDs. Usado por RolesService al asignar permisos.
   */
  async findByIds(ids: string[]): Promise<Permission[]> {
    if (!ids || ids.length === 0) return [];

    return this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.id IN (:...ids)', { ids })
      .getMany();
  }

  /**
   * Busca un permiso por su código. Usado por seeds y JwtStrategy.
   */
  async findByCode(code: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({ where: { code } });
  }

  /**
   * Agrupa un array de permisos por el recurso (parte antes del ':').
   * Ej: 'products:create' → grupo 'products'
   */
  private groupByResource(
    permissions: Permission[],
  ): Record<string, PermissionResponseDto[]> {
    return permissions.reduce(
      (groups, permission) => {
        const resource = permission.code.split(':')[0];
        if (!groups[resource]) {
          groups[resource] = [];
        }
        groups[resource].push({
          id: permission.id,
          code: permission.code,
          description: permission.description,
          createdAt: permission.createdAt,
        });
        return groups;
      },
      {} as Record<string, PermissionResponseDto[]>,
    );
  }
}