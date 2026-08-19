import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../users/entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(): Promise<{ resource: string; permissions: { id: string; code: string; description: string | null }[] }[]> {
    const permissions = await this.permissionRepository.find({
      order: { code: 'ASC' },
    });

    const groupedMap: Record<string, { id: string; code: string; description: string | null }[]> = {};

    for (const perm of permissions) {
      const [resource] = perm.code.split(':');
      if (!groupedMap[resource]) {
        groupedMap[resource] = [];
      }
      groupedMap[resource].push({
        id: perm.id,
        code: perm.code,
        description: perm.description,
      });
    }

    return Object.entries(groupedMap).map(([resource, permissions]) => ({
      resource,
      permissions,
    }));
  }
}
