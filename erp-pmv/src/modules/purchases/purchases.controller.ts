// src/modules/purchases/purchases.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { QueryPurchaseDto } from './dto/query-purchase.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Purchases')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @RequirePermissions('purchases:read')
  @ApiOperation({ summary: 'Lista compras con filtros y paginación' })
  findAll(@Query() query: QueryPurchaseDto) {
    return this.purchasesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('purchases:read')
  @ApiOperation({ summary: 'Detalle de una compra' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.findOne(id);
  }

  @Post()
  @RequirePermissions('purchases:create')
  @ApiOperation({ summary: 'Crear orden de compra en estado DRAFT' })
  create(
    @Body() dto: CreatePurchaseDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.purchasesService.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('purchases:update')
  @ApiOperation({ summary: 'Editar compra (solo DRAFT)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(id, dto);
  }

  @Patch(':id/submit')
  @RequirePermissions('purchases:update')
  @ApiOperation({ summary: 'Enviar compra a revisión (DRAFT → PENDING)' })
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.submit(id);
  }

  @Patch(':id/approve')
  @RequirePermissions('purchases:approve')
  @ApiOperation({ summary: 'Aprobar compra (PENDING → APPROVED)' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.purchasesService.approve(id, user.id);
  }

  @Patch(':id/receive')
  @RequirePermissions('purchases:receive')
  @ApiOperation({ summary: 'Marcar compra como recibida (APPROVED → RECEIVED)' })
  receive(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.receive(id);
  }

  @Patch(':id/cancel')
  @RequirePermissions('purchases:update')
  @ApiOperation({ summary: 'Cancelar compra' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.cancel(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('purchases:delete')
  @ApiOperation({ summary: 'Soft delete de compra (solo DRAFT)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.remove(id);
  }
}
