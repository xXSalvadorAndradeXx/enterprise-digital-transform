import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsService } from './permissions.service';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiOperation } from '@nestjs/swagger';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Permissions('roles:read')
  @ApiOperation({
    summary: 'Listar permisos agrupados por recurso',
    description: 'Retorna el catálogo completo de permisos disponibles en el sistema agrupados según su recurso de origen (prefijo en el código).',
  })
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
  @ApiUnauthorizedResponse({
    description: 'No autorizado: Token de acceso no válido o no enviado.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado: El usuario no cuenta con el permiso roles:read requerido.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 403 },
        message: { type: 'string', example: 'Forbidden resource' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  async findAll() {
    const result = await this.permissionsService.findAll();
    return {
      status: 'success',
      message: 'Permisos obtenidos exitosamente',
      data: result,
    };
  }
}
