// src/purchases/purchases.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiResponse, ApiQuery, ApiBody,
} from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { UpdatePurchaseStatusDto } from './dto/update-purchase-status.dto';
import { QueryPurchaseDto } from './dto/query-purchase.dto';
import { PurchaseResponseDto } from './dto/purchase-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Purchases')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  // T08 ────────────────────────────────────────────────────────────────────
  @Get()
  @RequirePermissions('purchases:read')
  @ApiOperation({ summary: ' Lista órdenes con filtros y paginación' })
  @ApiQuery({ name: 'status',     required: false, enum: ['PENDING','RECEIVED','CANCELLED'] })
  @ApiQuery({ name: 'supplierId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom',   required: false, type: String })
  @ApiQuery({ name: 'dateTo',     required: false, type: String })
  @ApiQuery({ name: 'page',       required: false, type: Number })
  @ApiQuery({ name: 'limit',      required: false, type: Number })
  @ApiResponse({ status: 200, description: '{ data[], meta }' })
  @ApiResponse({ status: 403, description: 'Sin permiso purchases:read' })
  findAll(@Query() query: QueryPurchaseDto) {
    return this.purchasesService.findAll(query);
  }

  // T10 ────────────────────────────────────────────────────────────────────
  @Get(':id')
  @RequirePermissions('purchases:read')
  @ApiOperation({ summary: 'Detalle de orden con líneas e historial de estados' })
  @ApiResponse({ status: 200, type: PurchaseResponseDto })
  @ApiResponse({ status: 404, description: 'Compra no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.findOneWithHistory(id);
  }

  // T13 ────────────────────────────────────────────────────────────────────
  @Get(':id/history')
  @RequirePermissions('purchases:read')
  @ApiOperation({ summary: ' Historial completo de cambios de estado' })
  @ApiResponse({ status: 200, description: 'Array de registros de auditoría' })
  @ApiResponse({ status: 404, description: 'Compra no encontrada' })
  findHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.findHistory(id);
  }

  // T09 ────────────────────────────────────────────────────────────────────
  @Post()
  @RequirePermissions('purchases:create')
  @ApiOperation({ summary: 'Registrar nueva orden de compra' })
  @ApiBody({ type: CreatePurchaseDto })
  @ApiResponse({ status: 201, type: PurchaseResponseDto })
  @ApiResponse({ status: 404, description: 'Proveedor o producto no encontrado' })
  @ApiResponse({ status: 422, description: 'Validación del DTO fallida' })
  create(
    @Body() dto: CreatePurchaseDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.purchasesService.create(dto, user.id);
  }

  // T11 ────────────────────────────────────────────────────────────────────
  @Patch(':id')
  @RequirePermissions('purchases:update')
  @ApiOperation({ summary: ' Editar líneas de orden en estado PENDING' })
  @ApiBody({ type: UpdatePurchaseDto })
  @ApiResponse({ status: 200, type: PurchaseResponseDto })
  @ApiResponse({ status: 400, description: 'Compra no está en estado PENDING' })
  @ApiResponse({ status: 404, description: 'Compra o producto no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(id, dto);
  }

  // T12 ────────────────────────────────────────────────────────────────────
  @Patch(':id/status')
  @RequirePermissions('purchases:change-status')
  @ApiOperation({
    summary: 'Cambiar estado: PENDING → RECEIVED (actualiza inventario) o CANCELLED',
  })
  @ApiBody({ type: UpdatePurchaseStatusDto })
  @ApiResponse({ status: 200, type: PurchaseResponseDto })
  @ApiResponse({ status: 409, description: 'Transición de estado inválida' })
  @ApiResponse({ status: 404, description: 'Compra no encontrada' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.purchasesService.changeStatus(id, dto.status, user.id);
  }
}