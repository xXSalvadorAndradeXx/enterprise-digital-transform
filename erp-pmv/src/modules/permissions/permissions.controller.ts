import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

/**
 * PermissionsController — expone el catálogo de permisos del sistema.
 * TDD § 4 Módulo Equipo — GET /api/v1/permissions
 *
 * Los permisos son de solo lectura; no existe endpoint de creación,
 * edición ni eliminación (son sembrados junto con las migraciones).
 */
@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * GET /api/v1/permissions
   * Lista todos los permisos disponibles agrupados por recurso.
   * TDD: Autorización JWT + roles:read
   */
  @Get()
  @Permissions('roles:read')
  @ApiOperation({
    summary: 'Listar todos los permisos del sistema agrupados por recurso',
    description:
      'Retorna el catálogo completo de permisos atómicos disponibles, ' +
      'agrupados por recurso (products, purchases, inventory, etc.). ' +
      'Requiere permiso roles:read.',
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de permisos agrupado por recurso',
    schema: {
      example: {
        customers: [
          {
            id: 'uuid',
            code: 'customers:create',
            description: 'Crear clientes',
            createdAt: '2026-07-20T10:00:00.000Z',
          },
        ],
        products: [
          {
            id: 'uuid',
            code: 'products:create',
            description: 'Crear productos',
            createdAt: '2026-07-20T10:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permiso roles:read' })
  async findAll(): Promise<Record<string, any>> {
    return this.permissionsService.findAll();
  }
}