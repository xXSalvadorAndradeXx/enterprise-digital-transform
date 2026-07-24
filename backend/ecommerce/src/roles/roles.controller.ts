import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { plainToInstance } from 'class-transformer';
import { RoleResponseDto } from './dto/role-response.dto';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiBody,
  ApiOkResponse, 
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse, 
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiParam,
  ApiOperation
} from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Permissions('roles:read')
  @ApiOperation({
    summary: 'Listar roles con contadores y detalle de permisos',
    description: 'Retorna todos los roles registrados en el sistema, mapeando para cada uno el conteo en tiempo real de usuarios y permisos asignados, además del detalle completo de sus permisos.',
  })
  @Get()
  @ApiOkResponse({
    description: 'Listado de roles con contadores y detalle de permisos obtenido exitosamente.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Roles obtenidos exitosamente' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'a2b16384-c113-49cd-b5d6-8c4d5865dec1' },
              name: { type: 'string', example: 'SUPERADMIN' },
              description: { type: 'string', example: 'Super Administrador del Sistema' },
              isSystem: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T00:20:17.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T00:20:17.000Z' },
              userCount: { type: 'integer', example: 1 },
              permissionCount: { type: 'integer', example: 15 },
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
    const result = await this.rolesService.findAll();
    return {
      status: 'success',
      message: 'Roles obtenidos exitosamente',
      data: plainToInstance(RoleResponseDto, result, { excludeExtraneousValues: true }),
    };
  }

  @Permissions('roles:create')
  @ApiOperation({
    summary: 'Crear un nuevo rol con permisos',
    description: 'Registra un nuevo rol no-sistema en la base de datos de forma transaccional, asociándolo a un conjunto de permisos existentes a través de sus IDs.',
  })
  @Post()
  @ApiCreatedResponse({
    description: 'El rol ha sido creado exitosamente.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Rol creado exitosamente' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'b3b16384-c113-49cd-b5d6-8c4d5865dec2' },
            name: { type: 'string', example: 'EDITOR' },
            description: { type: 'string', example: 'Permite editar productos' },
            isSystem: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T22:15:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T22:15:00.000Z' },
            userCount: { type: 'integer', example: 0 },
            permissionCount: { type: 'integer', example: 2 },
            permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'p3b16384-c113-49cd-b5d6-8c4d5865dec3' },
                  code: { type: 'string', example: 'products:create' },
                  description: { type: 'string', example: 'Crear productos' }
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
    description: 'Acceso denegado: El usuario no cuenta con el permiso roles:create requerido.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 403 },
        message: { type: 'string', example: 'Forbidden resource' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Conflicto: El nombre de rol especificado ya se encuentra registrado.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: { type: 'string', example: 'El rol con nombre "EDITOR" ya existe' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No encontrado: Uno o más IDs de permisos especificados no existen.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: { type: 'string', example: 'Uno o más permisos especificados no fueron encontrados' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiUnprocessableEntityResponse({
    description: 'Entidad no procesable: Formato de datos de entrada inválidos (errores de validación del DTO).',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 422 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['name must be a string', 'name should not be empty']
        },
        error: { type: 'string', example: 'Unprocessable Entity' }
      }
    }
  })
  @ApiBody({ type: CreateRoleDto, description: 'Datos del nuevo rol a crear' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const result = await this.rolesService.create(createRoleDto);
    return {
      status: 'success',
      message: 'Rol creado exitosamente',
      data: plainToInstance(RoleResponseDto, result, { excludeExtraneousValues: true }),
    };
  }

  @Permissions('roles:update')
  @ApiOperation({
    summary: 'Actualizar un rol y sus permisos',
    description: 'Modifica el nombre, descripción y el conjunto de permisos asociados a un rol de forma transaccional. Bloquea la edición si se trata de un rol preestablecido de sistema.',
  })
  @Patch(':id')
  @ApiParam({ name: 'id', type: String, description: 'Identificador único del rol (UUID versión 4)', example: 'b3b16384-c113-49cd-b5d6-8c4d5865dec2' })
  @ApiOkResponse({
    description: 'El rol ha sido actualizado exitosamente.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Rol actualizado exitosamente' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'b3b16384-c113-49cd-b5d6-8c4d5865dec2' },
            name: { type: 'string', example: 'EDITOR_MODIFICADO' },
            description: { type: 'string', example: 'Descripción actualizada' },
            isSystem: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T22:15:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T22:25:00.000Z' },
            userCount: { type: 'integer', example: 0 },
            permissionCount: { type: 'integer', example: 2 },
            permissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'p3b16384-c113-49cd-b5d6-8c4d5865dec3' },
                  code: { type: 'string', example: 'products:create' },
                  description: { type: 'string', example: 'Crear productos' }
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
    description: 'Acceso denegado: El usuario no cuenta con el permiso roles:update requerido, o intenta editar un rol de sistema.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 403 },
        message: { type: 'string', example: 'Los roles de sistema no pueden ser editados' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Conflicto: El nombre de rol especificado ya se encuentra registrado por otro rol.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: { type: 'string', example: 'El rol con nombre "CLIENTE" ya existe' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No encontrado: El rol o alguno de los IDs de permisos especificados no existen.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: { type: 'string', example: 'Rol con ID b3b16384-c113-49cd-b5d6-8c4d5865dec2 no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiUnprocessableEntityResponse({
    description: 'Entidad no procesable: Formato de datos de entrada inválidos (errores de validación del DTO).',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 422 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['name must be a string']
        },
        error: { type: 'string', example: 'Unprocessable Entity' }
      }
    }
  })
  @ApiBody({ type: CreateRoleDto, description: 'Campos del rol a actualizar' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: CreateRoleDto,
  ) {
    const result = await this.rolesService.update(id, updateRoleDto);
    return {
      status: 'success',
      message: 'Rol actualizado exitosamente',
      data: plainToInstance(RoleResponseDto, result, { excludeExtraneousValues: true }),
    };
  }

  @Permissions('roles:delete')
  @ApiOperation({
    summary: 'Eliminar rol de forma lógica (soft delete)',
    description: 'Aplica un borrado lógico sobre un rol dinámico si no es de sistema y no tiene usuarios activos asignados.',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, description: 'Identificador único del rol a eliminar (UUID versión 4)', example: 'b3b16384-c113-49cd-b5d6-8c4d5865dec2' })
  @ApiNoContentResponse({ description: 'El rol ha sido eliminado lógicamente (soft deleted) exitosamente (sin contenido).' })
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
    description: 'Acceso denegado: El usuario no cuenta con el permiso roles:delete requerido.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 403 },
        message: { type: 'string', example: 'Forbidden resource' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'No encontrado: El rol especificado no existe.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: { type: 'string', example: 'Rol con ID b3b16384-c113-49cd-b5d6-8c4d5865dec2 no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Conflicto: No se puede eliminar un rol de sistema o un rol que tiene usuarios asignados.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: { type: 'string', example: 'No se puede eliminar un rol que tiene usuarios asignados' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.rolesService.remove(id);
  }
}
