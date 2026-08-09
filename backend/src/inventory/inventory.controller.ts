import {
  Controller, Get,
  Param, Query, ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiHeader } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { PaginatedInventoryResponseDto } from './dto/paginated-inventory-response.dto';
import { LowStockResponseDto } from './dto/low-stock-response.dto';
import { InventoryWithDetailsResponseDto } from './dto/inventory-with-details-response.dto';
import { InventoryDetailDto } from './dto/inventory-detail.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

// RN-I-001: Operaciones públicas restringidas a solo lectura (GET)
// RN-I-007: Campos no modificables públicamente (brand, category_id, supplier_id)
@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'Authorization',
  description: 'JWT Bearer token',
})
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Listado paginado de inventarios' })
  @ApiResponse({ status: 200, type: PaginatedInventoryResponseDto, description: 'Listado paginado de inventarios' })
  @ApiResponse({ status: 403, description: 'Prohibido: Permisos insuficientes' })
  findAll(@Query() query: InventoryQueryDto): Promise<PaginatedInventoryResponseDto> {
    return this.inventoryService.findAll(query);
  }

  @Get('low-stock')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Listado de productos con stock bajo' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Listado de productos con stock bajo' })
  @ApiResponse({ status: 403, description: 'Prohibido: Permisos insuficientes' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findLowStock(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.findLowStock(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':id')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Detalle de un inventario con variantes' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, type: InventoryWithDetailsResponseDto, description: 'Inventario con variantes obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Inventario no encontrado' })
  @ApiResponse({ status: 403, description: 'Prohibido: Permisos insuficientes' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<InventoryWithDetailsResponseDto> {
    return this.inventoryService.findOne(id);
  }

  // RN-I-010: Detalles para Reabastecimiento
  @Get(':id/details')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Listado de variantes de un inventario' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, type: [InventoryDetailDto], description: 'Listado de variantes obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Inventario no encontrado' })
  @ApiResponse({ status: 403, description: 'Prohibido: Permisos insuficientes' })
  findDetails(@Param('id', ParseUUIDPipe) id: string): Promise<InventoryDetailDto[]> {
    return this.inventoryService.findDetails(id);
  }
}