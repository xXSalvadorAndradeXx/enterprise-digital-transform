import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsService } from './permissions.service';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Permissions('roles:read')
  @Get()
  @ApiOkResponse({
    description: 'Catálogo de permisos agrupado por recurso obtenido exitosamente.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Permisos obtenidos exitosamente' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string', example: 'users' },
              permissions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'p3b16384-c113-49cd-b5d6-8c4d5865dec3' },
                    code: { type: 'string', example: 'users:read' },
                    description: { type: 'string', example: 'Visualizar listado de usuarios' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado: Token de acceso no válido o no enviado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado: El usuario no cuenta con el permiso roles:read requerido.' })
  async findAll() {
    const result = await this.permissionsService.findAll();
    return {
      status: 'success',
      message: 'Permisos obtenidos exitosamente',
      data: result,
    };
  }
}
