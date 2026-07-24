// src/modules/inventory/inventory.controller.ts
import {
  Controller, Get, Post, Body,
  Param, Query, ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { QueryMovementsDto } from './dto/query-inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Stock actual de todos los productos' })
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get('movements')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Historial de movimientos con filtros y paginación' })
  findMovements(@Query() query: QueryMovementsDto) {
    return this.inventoryService.findMovements(query);
  }

  @Get(':productId')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Stock actual de un producto' })
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventoryService.findByProduct(productId);
  }

  @Post('adjust')
  @RequirePermissions('inventory:adjust')
  @ApiOperation({ summary: 'Ajuste manual de stock' })
  adjust(
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.inventoryService.adjust(dto, user.id);
  }
}