import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiResponse, ApiConsumes, ApiBody,
} from '@nestjs/swagger';

import { PurchasesService } from './purchases.service';
import { UpdatePurchaseMetadataDto } from './dto/update-purchase-metadata.dto';
import { CreateNewProductPurchaseDto } from './dto/create-new-product-purchase.dto';
import { CreateRestockPurchaseDto }    from './dto/create-restock-purchase.dto';
import { QueryPurchaseDto }           from './dto/query-purchase.dto';
import { PurchaseResponseDto }        from './dto/purchase-response.dto';
import { UploadInvoiceResponseDto }   from './dto/upload-invoice-response.dto';
import { JwtAuthGuard }         from '../common/guards/jwt-auth.guard';
import { PermissionsGuard }     from '../common/guards/permissions.guard';
import { RequirePermissions }   from '../common/decorators/require-permissions.decorator';
import { CurrentUser }          from '../common/decorators/current-user.decorator';

@ApiTags('Purchases')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  // POST /purchases/upload-invoice ─────────────────────────────────────────
  @Post('upload-invoice')
  @RequirePermissions('purchases:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir factura (PNG, JPG, PDF — máx 10 MB). Llamar antes de confirmar compra.' })
  @ApiResponse({ status: 201, type: UploadInvoiceResponseDto })
  @ApiResponse({ status: 400, description: 'Formato o tamaño inválido' })
  uploadInvoice(@UploadedFile() file: Express.Multer.File) {
    return this.purchasesService.uploadInvoice(file);
  }

  // POST /purchases/nuevo-producto ─────────────────────────────────────────
  @Post('new-product')
  @RequirePermissions('purchases:create')
  @ApiOperation({
    summary: 'Confirmar compra de nuevo producto — transacción atómica T1',
    description: 'Crea supplier_purchase + items + inventories + inventory_details + inventory_movements.',
  })
  @ApiBody({ type: CreateNewProductPurchaseDto })
  @ApiResponse({ status: 201, type: PurchaseResponseDto })
  @ApiResponse({ status: 404, description: 'Proveedor o categoría no encontrada' })
  @ApiResponse({ status: 409, description: 'Doble envío detectado (RN-029)' })
  @ApiResponse({ status: 422, description: 'Variantes duplicadas u otras validaciones' })
  @ApiResponse({ status: 500, description: 'Fallo en transacción — rollback automático' })
  createNuevoProducto(
    @Body() dto: CreateNewProductPurchaseDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.purchasesService.createNuevoProducto(dto, user.id);
  }

  // POST /purchases/reabastecimiento ───────────────────────────────────────
  @Post('replenishment')
  @RequirePermissions('purchases:create')
  @ApiOperation({
    summary: 'Confirmar reabastecimiento — transacción atómica T2',
    description: 'Crea supplier_purchase + items, actualiza stock en inventory_details, inserta inventory_movements.',
  })
  @ApiBody({ type: CreateRestockPurchaseDto })
  @ApiResponse({ status: 201, type: PurchaseResponseDto })
  @ApiResponse({ status: 404, description: 'Inventario o detalle no encontrado' })
  @ApiResponse({ status: 409, description: 'Detalle no pertenece al inventario / doble envío' })
  @ApiResponse({ status: 422, description: 'Validación de campos fallida' })
  createReabastecimiento(
    @Body() dto: CreateRestockPurchaseDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.purchasesService.createReabastecimiento(dto, user.id);
  }

  // GET /purchases ─────────────────────────────────────────────────────────
  @Get()
  @RequirePermissions('purchases:read')
  @ApiOperation({ summary: 'Lista paginada de compras con filtros' })
  @ApiResponse({ status: 200, description: '{ data: PurchaseResponseDto[], meta }' })
  findAll(@Query() query: QueryPurchaseDto) {
    return this.purchasesService.findAll(query);
  }

  // GET /purchases/inventory/:inventoryId/preview-restock ──────────────────
  // ⚠ DEBE ir antes de /inventory/:inventoryId para evitar conflicto de rutas
  @Get('inventory/:inventoryId/preview-restock')
  @RequirePermissions('purchases:read')
  @ApiOperation({
    summary: 'Vista previa de inventario para pre-poblar el formulario de reabastecimiento',
  })
  @ApiResponse({ status: 200, description: '{ inventory, details[] }' })
  @ApiResponse({ status: 404, description: 'Inventario no encontrado' })
  getRestockPreview(@Param('inventoryId', ParseUUIDPipe) inventoryId: string) {
    return this.purchasesService.getRestockPreview(inventoryId);
  }

  // GET /purchases/inventory/:inventoryId ──────────────────────────────────
  @Get('inventory/:inventoryId')
  @RequirePermissions('purchases:read')
  @ApiOperation({ summary: 'Historial de compras de un inventario (NUEVO_PRODUCTO + REABASTECIMIENTO)' })
  @ApiResponse({ status: 200, description: '{ data: PurchaseResponseDto[], meta }' })
  @ApiResponse({ status: 404, description: 'Inventario no encontrado' })
  findByInventory(
    @Param('inventoryId', ParseUUIDPipe) inventoryId: string,
    @Query() query: QueryPurchaseDto,
  ) {
    return this.purchasesService.findByInventory(inventoryId, query);
  }

  // GET /purchases/:id ─────────────────────────────────────────────────────
  @Get(':id')
  @RequirePermissions('purchases:read')
  @ApiOperation({ summary: 'Detalle de compra con todas sus variantes' })
  @ApiResponse({ status: 200, type: PurchaseResponseDto })
  @ApiResponse({ status: 404, description: 'Compra no encontrada o eliminada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.findOne(id);
  }

  // PATCH /purchases/:id ───────────────────────────────────────────────────
  @Patch(':id')
  @RequirePermissions('purchases:update')
  @ApiOperation({
    summary: 'Editar compra — transacción atómica T4',
    description:
      'Actualiza metadatos (proveedor, fecha, producto, categoría, marca, género, factura) '
      + 'y variantes (talla, color, cantidad, costo unitario). '
      + 'Si cambia la cantidad de una variante se registra un movimiento de inventario '
      + '(Entrada si aumenta, Ajuste si disminuye). '
      + 'Recalcula totalAmount, totalQuantity y stock del inventario. '
      + 'Requiere confirmación en el Frontend antes de enviar. '
      + 'Campos inmutables: type, reference, status, sku.',
  })
  @ApiBody({ type: UpdatePurchaseMetadataDto })
  @ApiResponse({ status: 200, type: PurchaseResponseDto })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  @ApiResponse({ status: 404, description: 'Compra, proveedor, categoría o variante no encontrada' })
  @ApiResponse({ status: 409, description: 'Combinación talla-color duplicada' })
  @ApiResponse({ status: 422, description: 'Stock quedaría negativo en alguna variante' })
  @ApiResponse({ status: 500, description: 'Fallo en transacción — rollback automático' })
  updatePurchase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseMetadataDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.purchasesService.updatePurchase(id, dto, user.id);
  }

  // DELETE /purchases/:id ──────────────────────────────────────────────────
  // ⚠ El Tech Lead debe revisar este endpoint manualmente antes de merge
  @Delete(':id')
  @RequirePermissions('purchases:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete de compra — transacción atómica T3',
    description:
      'Establece deleted_at en supplier_purchases. '
      + 'Por cada variante crea un inventory_movement de tipo AJUSTE con cantidad negativa '
      + 'y decrementa stock en inventory_details. '
      + 'Requiere confirmación explícita del usuario en el Frontend (modal de confirmación).',
  })
  @ApiResponse({ status: 204, description: 'Eliminada correctamente' })
  @ApiResponse({ status: 404, description: 'Compra no encontrada' })
  @ApiResponse({ status: 422, description: 'Stock quedaría negativo en alguna variante' })
  softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.purchasesService.softDelete(id, user.id);
  }
}