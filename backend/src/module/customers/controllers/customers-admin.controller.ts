import { Controller, Get, Query, UseGuards, Param, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiParam, ApiNotFoundResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { plainToInstance } from 'class-transformer';
import { CustomersService } from '../customers.service';
import { FindCustomersQueryDto } from '../dto/find-customers-query.dto';
import { CustomerAdminResponseDto } from '../dto/customer-admin-response.dto';

@ApiTags('Admin / Customers')
@ApiBearerAuth()
@Controller('admin/customers')
export class CustomersAdminController {
  constructor(private readonly customersService: CustomersService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('customers:read')
  @ApiOperation({
    summary: 'Listar clientes registrados (Admin)',
    description: 'Obtiene la lista de clientes registrados en la plataforma con soporte para búsqueda, filtrado por estado y paginación. Requiere el permiso "customers:read".',
  })
  @ApiOkResponse({
    description: 'Lista de clientes obtenida exitosamente.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            customers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec1' },
                  fullName: { type: 'string', example: 'Cliente de Ejemplo' },
                  email: { type: 'string', example: 'cliente@example.com' },
                  lastOrderAt: { type: 'string', format: 'date-time', example: '2026-08-24T12:00:00.000Z', nullable: true },
                  totalOrders: { type: 'integer', example: 5 },
                  totalSpent: { type: 'string', example: '150.75' },
                },
              },
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 10 },
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                totalPages: { type: 'integer', example: 1 },
              },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado: Token de acceso no válido o no enviado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado: El usuario no cuenta con el permiso "customers:read" requerido.',
  })
  @Get()
  async findAll(@Query() query: FindCustomersQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { page: _, limit: __, ...filters } = query;
    const { customers, meta } = await this.customersService.findAllForAdmin(page, limit, filters);

    // Mapear a una estructura segura conteniendo exactamente los campos requeridos
    const formattedCustomers = customers.map((c) => {
      const mapped = {
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        lastOrderAt: c.lastOrderAt ? c.lastOrderAt : null,
        totalOrders: c.totalOrders,
        totalSpent: (c.totalSpent || 0).toFixed(2),
      };
      return plainToInstance(CustomerAdminResponseDto, mapped, { excludeExtraneousValues: true });
    });

    const hasNextPage = page < meta.totalPages;
    const hasPreviousPage = page > 1;

    return {
      success: true,
      data: {
        items: formattedCustomers,
        meta: {
          page,
          limit,
          total: meta.total,
          totalPages: meta.totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('customers:read')
  @ApiOperation({
    summary: 'Obtener detalle de un cliente específico (Admin)',
    description: 'Obtiene la información detallada de un cliente registrado por su ID. Requiere el permiso "customers:read".',
  })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID v4)', format: 'uuid' })
  @ApiOkResponse({
    description: 'Detalle del cliente obtenido exitosamente.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec1' },
            fullName: { type: 'string', example: 'Cliente de Ejemplo' },
            email: { type: 'string', example: 'cliente@example.com' },
            phone: { type: 'string', example: '+50370000000' },
            dui: { type: 'string', example: '00000000-0' },
            isActive: { type: 'boolean', example: true },
            totalSpent: { type: 'string', example: '150.75' },
            totalOrders: { type: 'integer', example: 5 },
            lastOrderAt: { type: 'string', format: 'date-time', example: '2026-08-24T12:00:00.000Z', nullable: true },
            createdAt: { type: 'string', format: 'date-time', example: '2026-08-23T22:31:00.000Z' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No encontrado: No se encontró el cliente con el ID especificado.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado: Token de acceso no válido o no enviado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado: El usuario no cuenta con el permiso "customers:read" requerido.',
  })
  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4', exceptionFactory: () => {
      return new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'El ID del cliente debe ser un UUID versión 4 válido',
      });
    }}))
    id: string,
  ) {
    const customer = await this.customersService.findOne(id);

    const mapped = {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      dui: customer.dui,
      isActive: customer.isActive,
      totalSpent: (customer.totalSpent || 0).toFixed(2),
      totalOrders: customer.totalOrders,
      lastOrderAt: customer.lastOrderAt ? customer.lastOrderAt : null,
      createdAt: customer.createdAt,
      addresses: customer.addresses || [],
    };

    const serialized = plainToInstance(CustomerAdminResponseDto, mapped, { excludeExtraneousValues: true });

    return {
      success: true,
      data: serialized,
    };
  }
}
