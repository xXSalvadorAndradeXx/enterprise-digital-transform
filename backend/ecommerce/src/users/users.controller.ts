import { Controller, Get, Post, Patch, Delete, UseGuards, Request, Query, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UsersService } from './users.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiParam,
  ApiOkResponse, 
  ApiCreatedResponse,
  ApiUnauthorizedResponse, 
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse
} from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:create')
  @Post()
  @ApiCreatedResponse({
    description: 'El usuario ha sido creado exitosamente.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Usuario creado exitosamente' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'f8d3848b-d113-49cd-a5d6-8c4d5865dec9' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            email: { type: 'string', example: 'juan.perez@ecommerce.local' },
            isActive: { type: 'boolean', example: true },
            mustChangePassword: { type: 'boolean', example: true },
            failedLoginAttempts: { type: 'integer', example: 0 },
            lockedUntil: { type: 'string', format: 'date-time', example: null, nullable: true },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T21:29:03.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T21:29:03.000Z' },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'b3b16384-c113-49cd-b5d6-8c4d5865dec2' },
                  name: { type: 'string', example: 'CLIENTE' },
                  description: { type: 'string', example: 'Cliente de la tienda' },
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado: Token de acceso no válido o no enviado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado: El usuario no cuenta con el permiso users:create requerido.' })
  @ApiConflictResponse({ description: 'Conflicto: El correo electrónico especificado ya se encuentra registrado.' })
  @ApiUnprocessableEntityResponse({ description: 'Entidad no procesable: Datos de entrada inválidos (errores de validación del DTO).' })
  async create(@Body() createUserDto: CreateUserDto) {
    const { user } = await this.usersService.create(createUserDto);
    const serializedUser = plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuario creado exitosamente',
      data: serializedUser,
    };
  }

  @UseGuards(JwtAuthGuard) 
  @Get('profile')
  getProfile(@Request() req) {
    return {
      message: '¡Acceso exitoso a la ruta protegida!',
      user: req.user,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:read')
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (paginación basada en offset)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Cantidad de elementos por página', example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Término de búsqueda parcial sobre first_name, last_name o email (case-insensitive)' })
  @ApiQuery({ name: 'email', required: false, type: String, description: 'Búsqueda parcial/coincidencia sobre email usando ILIKE' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por estado activo o inactivo' })
  @ApiQuery({ name: 'roleId', required: false, type: String, description: 'Filtrar por ID de rol asociado (UUID)' })
  @ApiOkResponse({
    description: 'Listado de usuarios obtenido exitosamente.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Usuarios obtenidos exitosamente' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec9' },
              firstName: { type: 'string', example: 'Super' },
              lastName: { type: 'string', example: 'Admin' },
              email: { type: 'string', example: 'superadmin@ecommerce.local' },
              isActive: { type: 'boolean', example: true },
              mustChangePassword: { type: 'boolean', example: true },
              failedLoginAttempts: { type: 'integer', example: 0 },
              lockedUntil: { type: 'string', format: 'date-time', example: null, nullable: true },
              createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T00:20:17.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T00:20:17.000Z' },
              roles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'a2b16384-c113-49cd-b5d6-8c4d5865dec1' },
                    name: { type: 'string', example: 'SUPERADMIN' },
                    description: { type: 'string', example: 'Super Administrador del Sistema' },
                  }
                }
              }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 1 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 1 },
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado: Token de acceso no válido o no enviado en el encabezado Authorization.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado: El usuario no cuenta con el permiso users:read requerido.' })
  async findAll(@Query() query: FindUsersQueryDto) {
    const { page, limit, ...filters } = query;
    const { users, meta } = await this.usersService.findAll(page, limit, filters);
    const serializedUsers = plainToInstance(UserResponseDto, users, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuarios obtenidos exitosamente',
      data: serializedUsers,
      meta,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:read')
  @Get(':id')
  @ApiParam({ name: 'id', type: String, description: 'Identificador único del usuario (UUID versión 4)', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec9' })
  @ApiOkResponse({
    description: 'Detalle del usuario obtenido exitosamente.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Usuario obtenido exitosamente' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec9' },
            firstName: { type: 'string', example: 'Super' },
            lastName: { type: 'string', example: 'Admin' },
            email: { type: 'string', example: 'superadmin@ecommerce.local' },
            isActive: { type: 'boolean', example: true },
            mustChangePassword: { type: 'boolean', example: true },
            failedLoginAttempts: { type: 'integer', example: 0 },
            lockedUntil: { type: 'string', format: 'date-time', example: null, nullable: true },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T00:20:17.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T00:20:17.000Z' },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'a2b16384-c113-49cd-b5d6-8c4d5865dec1' },
                  name: { type: 'string', example: 'SUPERADMIN' },
                  description: { type: 'string', example: 'Super Administrador del Sistema' },
                }
              }
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['users:read', 'users:create', 'products:read']
            }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado: Token de acceso no válido o no enviado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado: El usuario no cuenta con el permiso users:read requerido.' })
  @ApiNotFoundResponse({ description: 'No encontrado: El usuario especificado no existe o ha sido eliminado lógicamente (soft deleted).' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.usersService.findOne(id);
    const serializedUser = plainToInstance(UserResponseDto, result, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuario obtenido exitosamente',
      data: serializedUser,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/roles')
  async assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    const result = await this.usersService.assignRoles(id, assignRolesDto);
    const serializedUser = plainToInstance(UserResponseDto, result, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Roles asignados exitosamente',
      data: serializedUser,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.usersService.remove(id);
    const serializedUser = plainToInstance(UserResponseDto, result, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuario eliminado exitosamente',
      data: serializedUser,
    };
  }
}