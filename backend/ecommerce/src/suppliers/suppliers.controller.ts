import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { SuppliersService } from './suppliers.service';
import { SupplierQueryDto } from './dto/supplier-query.dto';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Permissions('suppliers:read')
  @ApiOperation({ summary: 'Obtener lista paginada de proveedores con búsqueda opcional' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Límite de elementos por página' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Búsqueda case-insensitive por nombre o contacto' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de proveedores retornada con éxito',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Distribuidora San Salvador',
            contactName: 'Juan Pérez',
            phone: '+50375943334',
            email: 'contacto@sansalvador.sv',
            address: 'Calle Principal #123, San Salvador',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso prohibido: usuario no posee el permiso suppliers:read',
  })
  async findAll(@Query() queryDto: SupplierQueryDto) {
    const result = await this.suppliersService.findAll(queryDto);
    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }
}
