import { Controller, Get, Post, Patch, Delete, UseGuards, Request, Query, Param, Body, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UsersService } from './users.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiParam,
  ApiBody,
  ApiOkResponse, 
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse, 
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse,
  ApiOperation
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:create')
  @ApiOperation({
    summary: 'Crear un nuevo usuario',
    description: 'Crea un nuevo usuario en el sistema con un conjunto de roles, generando una contraseña temporal compleja de forma transaccional.',
  })
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
        },
        temporaryPassword: { type: 'string', example: 'AbC123!@#' }
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
    description: 'Acceso denegado: El usuario no cuenta con el permiso users:create requerido.',
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
    description: 'Conflicto: El correo electrónico especificado ya se encuentra registrado.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: { type: 'string', example: 'El correo electrónico "juan.perez@ecommerce.local" ya se encuentra registrado' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @ApiUnprocessableEntityResponse({
    description: 'Entidad no procesable: Datos de entrada inválidos (errores de validación del DTO).',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 422 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['email must be an email', 'firstName should not be empty']
        },
        error: { type: 'string', example: 'Unprocessable Entity' }
      }
    }
  })
  @ApiBody({ type: CreateUserDto, description: 'Datos del nuevo usuario a crear' })
  async create(@Body() createUserDto: CreateUserDto) {
    const { user, temporaryPassword } = await this.usersService.create(createUserDto);
    const serializedUser = plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuario creado exitosamente',
      data: serializedUser,
      temporaryPassword,
    };
  }

  @UseGuards(JwtAuthGuard) 
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description: 'Retorna los detalles del usuario actual extraídos a partir del token de acceso JWT provisto en la cabecera.',
  })
  @Get('profile')
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
  getProfile(@Request() req) {
    return {
      message: '¡Acceso exitoso a la ruta protegida!',
      user: req.user,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:read')
  @ApiOperation({
    summary: 'Listar usuarios con filtros y paginación',
    description: 'Retorna un listado paginado y filtrado de usuarios en el sistema, permitiendo búsquedas por nombre, email, rol y estado activo.',
  })
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
  @ApiUnauthorizedResponse({
    description: 'No autorizado: Token de acceso no válido o no enviado en el encabezado Authorization.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
      }
    }
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado: El usuario no cuenta con el permiso users:read requerido.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 403 },
        message: { type: 'string', example: 'Forbidden resource' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
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
  @ApiOperation({
    summary: 'Obtener detalle de usuario por ID',
    description: 'Retorna los detalles completos de un usuario a partir de su ID (UUID), incluyendo sus roles y la lista de permisos efectivos unificados.',
  })
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
    description: 'Acceso denegado: El usuario no cuenta con el permiso users:read requerido.',
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
    description: 'No encontrado: El usuario especificado no existe o ha sido eliminado lógicamente (soft deleted).',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: { type: 'string', example: 'Usuario con ID d3b07384-d113-49cd-a5d6-8c4d5865dec9 no encontrado o inactivo' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.usersService.findOne(id);
    const serializedUser = plainToInstance(UserResponseDto, result, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuario obtenido exitosamente',
      data: serializedUser,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:update')
  @ApiOperation({
    summary: 'Actualizar información de un usuario',
    description: 'Modifica los datos personales y/o el estado activo de un usuario existente, previniendo desactivar al último SUPERADMIN activo en tiempo real.',
  })
  @Patch(':id')
  @ApiParam({ name: 'id', type: String, description: 'Identificador único del usuario a actualizar (UUID versión 4)', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec9' })
  @ApiOkResponse({
    description: 'El usuario ha sido actualizado exitosamente.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Usuario actualizado exitosamente' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec9' },
            firstName: { type: 'string', example: 'Super' },
            lastName: { type: 'string', example: 'Modificado' },
            email: { type: 'string', example: 'superadmin.modificado@ecommerce.local' },
            isActive: { type: 'boolean', example: true },
            mustChangePassword: { type: 'boolean', example: true },
            failedLoginAttempts: { type: 'integer', example: 0 },
            lockedUntil: { type: 'string', format: 'date-time', example: null, nullable: true },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T00:20:17.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T22:04:00.000Z' },
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
    description: 'Acceso denegado: El usuario no cuenta con el permiso users:update requerido.',
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
    description: 'No encontrado: El usuario a editar o alguno de los roles especificados no existen.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: { type: 'string', example: 'Usuario no encontrado o inactivo' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Conflicto: El correo electrónico ya se encuentra registrado por otro usuario, o la operación intenta desactivar/remover el rol SUPERADMIN del último administrador activo.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: { type: 'string', example: 'No se puede desactivar al último administrador SUPERADMIN activo' },
        error: { type: 'string', example: 'Conflict' }
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
          example: ['email must be an email']
        },
        error: { type: 'string', example: 'Unprocessable Entity' }
      }
    }
  })
  @ApiBody({ type: UpdateUserDto, description: 'Campos del usuario a actualizar (todos opcionales)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const result = await this.usersService.update(id, updateUserDto);
    const serializedUser = plainToInstance(UserResponseDto, result, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuario actualizado exitosamente',
      data: serializedUser,
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:assign-roles')
  @ApiOperation({
    summary: 'Reasignar roles a un usuario',
    description: 'Reemplaza de forma transaccional el conjunto de roles asociados a un usuario y recalifica de forma inmediata sus permisos efectivos en el sistema.',
  })
  @Patch(':id/roles')
  @ApiParam({ name: 'id', type: String, description: 'Identificador único del usuario a reasignar roles (UUID versión 4)', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec9' })
  @ApiOkResponse({
    description: 'Los roles han sido reasignados exitosamente de forma transaccional y los permisos recalificados.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Roles asignados exitosamente' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec9' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            email: { type: 'string', example: 'juan.perez@ecommerce.local' },
            isActive: { type: 'boolean', example: true },
            mustChangePassword: { type: 'boolean', example: true },
            failedLoginAttempts: { type: 'integer', example: 0 },
            lockedUntil: { type: 'string', format: 'date-time', example: null, nullable: true },
            createdAt: { type: 'string', format: 'date-time', example: '2026-07-22T00:20:17.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-07-22T22:15:00.000Z' },
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
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              example: ['products:read', 'orders:create']
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
    description: 'Acceso denegado: El usuario no cuenta con el permiso users:assign-roles requerido.',
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
    description: 'No encontrado: El usuario o alguno de los roles provistos en la lista no existen.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: { type: 'string', example: 'Usuario no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Conflicto: La operación violaría la regla del último SUPERADMIN activo, dejando al sistema sin administradores.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: { type: 'string', example: 'No se puede remover el rol de SUPERADMIN al único administrador activo' },
        error: { type: 'string', example: 'Conflict' }
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
          example: ['roleIds must be an array']
        },
        error: { type: 'string', example: 'Unprocessable Entity' }
      }
    }
  })
  @ApiBody({ type: AssignRolesDto, description: 'Lista de IDs de roles a asignar al usuario (reemplaza los actuales)' })
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

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:delete')
  @ApiOperation({
    summary: 'Eliminar usuario de forma lógica (soft delete)',
    description: 'Desactiva al usuario y aplica un borrado lógico en la base de datos de manera transaccional, revocando inmediatamente todos sus refresh tokens activos.',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, description: 'Identificador único del usuario a eliminar (UUID versión 4)', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec9' })
  @ApiNoContentResponse({ description: 'El usuario ha sido desactivado y eliminado lógicamente de forma transaccional con éxito (sin contenido).' })
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
    description: 'Acceso denegado: El usuario no cuenta con el permiso users:delete requerido.',
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
    description: 'No encontrado: El usuario especificado no existe.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: { type: 'string', example: 'Usuario con ID d3b07384-d113-49cd-a5d6-8c4d5865dec9 no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Conflicto: No se puede eliminar o desactivar al último administrador SUPERADMIN activo del sistema.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 409 },
        message: { type: 'string', example: 'No se puede eliminar al único administrador SUPERADMIN activo' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users:update')
  @ApiOperation({
    summary: 'Generar nueva contraseña temporal para un usuario',
    description: 'Genera una nueva contraseña temporal compleja para el usuario especificado, actualiza su hash en base de datos, marca mustChangePassword en true y reinicia sus contadores de intentos fallidos y bloqueos.',
  })
  @Post(':id/generate-temporary-password')
  @ApiParam({ name: 'id', type: String, description: 'Identificador único del usuario (UUID v4)', example: 'f8d3848b-d113-49cd-a5d6-8c4d5865dec9' })
  @ApiOkResponse({
    description: 'La contraseña temporal ha sido generada exitosamente.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Contraseña temporal generada exitosamente' },
        temporaryPassword: { type: 'string', example: 'AbC123!@#$%' }
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
    description: 'Acceso denegado: El usuario no cuenta con el permiso users:update requerido.',
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
    description: 'No encontrado: El usuario especificado no existe en la base de datos.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'integer', example: 404 },
        message: { type: 'string', example: 'Usuario no encontrado' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async generateTemporaryPassword(@Param('id', ParseUUIDPipe) id: string) {
    const { temporaryPassword } = await this.usersService.generateTemporaryPassword(id);
    return {
      status: 'success',
      message: 'Contraseña temporal generada exitosamente',
      temporaryPassword,
    };
  }
}
