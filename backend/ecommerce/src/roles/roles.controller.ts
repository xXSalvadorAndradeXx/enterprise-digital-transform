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
  ApiOkResponse, 
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse, 
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiParam
} from '@nestjs/swagger';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Permissions('roles:read')
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
  @ApiUnauthorizedResponse({ description: 'No autorizado: Token de acceso no válido o no enviado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado: El usuario no cuenta con el permiso roles:read requerido.' })
  async findAll() {
    const result = await this.rolesService.findAll();
    return {
      status: 'success',
      message: 'Roles obtenidos exitosamente',
      data: plainToInstance(RoleResponseDto, result, { excludeExtraneousValues: true }),
    };
  }

  @Permissions('roles:create')
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
  @ApiUnauthorizedResponse({ description: 'No autorizado: Token de acceso no válido o no enviado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado: El usuario no cuenta con el permiso roles:create requerido.' })
  @ApiConflictResponse({ description: 'Conflicto: El nombre de rol especificado ya se encuentra registrado.' })
  @ApiNotFoundResponse({ description: 'No encontrado: Uno o más IDs de permisos especificados no existen.' })
  @ApiUnprocessableEntityResponse({ description: 'Entidad no procesable: Formato de datos de entrada inválidos (errores de validación del DTO).' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const result = await this.rolesService.create(createRoleDto);
    return {
      status: 'success',
      message: 'Rol creado exitosamente',
      data: plainToInstance(RoleResponseDto, result, { excludeExtraneousValues: true }),
    };
  }

  @Permissions('roles:update')
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
  @ApiUnauthorizedResponse({ description: 'No autorizado: Token de acceso no válido o no enviado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado: El usuario no cuenta con el permiso roles:update requerido, o intenta editar un rol de sistema.' })
  @ApiConflictResponse({ description: 'Conflicto: El nombre de rol especificado ya se encuentra registrado por otro rol.' })
  @ApiNotFoundResponse({ description: 'No encontrado: El rol o alguno de los IDs de permisos especificados no existen.' })
  @ApiUnprocessableEntityResponse({ description: 'Entidad no procesable: Formato de datos de entrada inválidos (errores de validación del DTO).' })
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
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, description: 'Identificador único del rol a eliminar (UUID versión 4)', example: 'b3b16384-c113-49cd-b5d6-8c4d5865dec2' })
  @ApiNoContentResponse({ description: 'El rol ha sido eliminado lógicamente (soft deleted) exitosamente (sin contenido).' })
  @ApiUnauthorizedResponse({ description: 'No autorizado: Token de acceso no válido o no enviado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado: El usuario no cuenta con el permiso roles:delete requerido.' })
  @ApiNotFoundResponse({ description: 'No encontrado: El rol especificado no existe.' })
  @ApiConflictResponse({ description: 'Conflicto: No se puede eliminar un rol de sistema o un rol que tiene usuarios asignados.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.rolesService.remove(id);
  }
}
