import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CustomersService } from '../customers.service';
import { FindCustomersQueryDto } from '../dto/find-customers-query.dto';

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
    const formattedCustomers = customers.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      lastOrderAt: c.lastOrderAt ? c.lastOrderAt : null,
      totalOrders: c.totalOrders,
      totalSpent: (c.totalSpent || 0).toFixed(2),
    }));

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
}
