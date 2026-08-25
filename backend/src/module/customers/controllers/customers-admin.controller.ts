import { Controller, Get, Query, UseGuards, Param, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiParam, ApiNotFoundResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { plainToInstance } from 'class-transformer';
import { CustomersService } from '../customers.service';
import { FindCustomersQueryDto } from '../dto/find-customers-query.dto';
import { FindCustomerOrdersQueryDto } from '../dto/find-customer-orders-query.dto';
import { CustomerAdminResponseDto } from '../dto/customer-admin-response.dto';

@ApiTags('Admin / Customers')
@ApiBearerAuth()
@Controller('admin/customers')
export class CustomersAdminController {
  constructor(private readonly customersService: CustomersService) { }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('customers:read')
  @ApiOperation({
    summary: 'Listar clientes registrados (Admin)',
    description: 'Obtiene la lista de clientes registrados en la plataforma con soporte para búsqueda, filtrado por estado y paginación. Requiere el permiso "customers:read".',
  })
  @ApiOkResponse({
    description: 'Lista de clientes obtenida exitosamente.',
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

    const formattedCustomers = customers.map((c) => {
      const mapped = {
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        lastOrderAt: c.lastOrderAt ? c.lastOrderAt : null,
        totalOrders: c.totalOrders,
        totalSpent: Number(c.totalSpent || 0).toFixed(2),
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
    @Param('id', new ParseUUIDPipe({
      version: '4', exceptionFactory: () => {
        return new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'El ID del cliente debe ser un UUID versión 4 válido',
        });
      }
    }))
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
      totalSpent: Number(customer.totalSpent || 0).toFixed(2),
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

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('customers:read')
  @ApiOperation({
    summary: 'Obtener historial de pedidos de un cliente (Admin)',
    description: 'Obtiene los pedidos asociados a un cliente con paginación. Requiere el permiso "customers:read".',
  })
  @ApiParam({ name: 'id', description: 'ID del cliente (UUID v4)', format: 'uuid' })
  @ApiOkResponse({
    description: 'Historial de pedidos obtenido exitosamente.',
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
  @Get(':id/orders')
  async findOrders(
    @Param('id', new ParseUUIDPipe({
      version: '4', exceptionFactory: () => {
        return new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'El ID del cliente debe ser un UUID versión 4 válido',
        });
      }
    }))
    id: string,
    @Query() query: FindCustomerOrdersQueryDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { orders, meta } = await this.customersService.findOrdersForCustomer(id, page, limit);

    const mapHistoricalStatus = (status: string): string => {
      const upperStatus = (status || '').toUpperCase();
      switch (upperStatus) {
        case 'NEW':
          return 'NEW';
        case 'PENDING':
        case 'PROCESSING':
          return 'PENDING';
        case 'ON_ROUTE':
        case 'SHIPPED':
          return 'ON_ROUTE';
        case 'READY_FOR_PICKUP':
          return 'READY_FOR_PICKUP';
        case 'DELIVERED':
        case 'COMPLETED':
        case 'PICKED_UP':
          return 'DELIVERED';
        case 'CANCELLED':
          return 'CANCELLED';
        default:
          return 'PENDING';
      }
    };

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: Number(o.totalAmount || (o as any).total || 0).toFixed(2),
      status: mapHistoricalStatus(o.status),
      createdAt: o.createdAt,
    }));

    const hasNextPage = page < meta.totalPages;
    const hasPreviousPage = page > 1;

    return {
      success: true,
      data: {
        items: formattedOrders,
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
