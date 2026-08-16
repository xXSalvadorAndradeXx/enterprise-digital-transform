import {
  Injectable, NotFoundException, BadRequestException,
  ConflictException, UnprocessableEntityException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { randomUUID } from 'crypto';
import * as path from 'path';

import { SupplierPurchase }     from './entities/supplier-purchase.entity';
import { SupplierPurchaseItem } from './entities/supplier-purchase-item.entity';
import { CreateNewProductPurchaseDto } from './dto/create-new-product-purchase.dto';
import { CreateRestockPurchaseDto }    from './dto/create-restock-purchase.dto';
import { QueryPurchaseDto }           from './dto/query-purchase.dto';
import { PurchaseStatus } from './enums/purchase-status.enum';
import { PurchaseType }   from './enums/purchase-type.enum';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(SupplierPurchase)
    private readonly purchaseRepo: Repository<SupplierPurchase>,
    @InjectRepository(SupplierPurchaseItem)
    private readonly itemRepo: Repository<SupplierPurchaseItem>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Listado con filtros y paginación ─────────────────────────────────────
  async findAll(query: QueryPurchaseDto) {
    const {
      type, supplierId, dateFrom, dateTo, search,
      sortBy = 'created_at', order = 'DESC',
      includeDeleted = false,
      page = 1, limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    const qb = this.purchaseRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.items', 'items')
      .orderBy(`p.${sortBy}`, order)
      .skip(skip)
      .take(limit);

    if (includeDeleted) qb.withDeleted();
    if (type)           qb.andWhere('p.type = :type', { type });
    if (supplierId)     qb.andWhere('p.supplier_id = :supplierId', { supplierId });
    if (search)         qb.andWhere('p.product_name ILIKE :search', { search: `%${search}%` });
    if (dateFrom)       qb.andWhere('p.created_at >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo)         qb.andWhere('p.created_at <= :dateTo', { dateTo: new Date(dateTo) });

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Detalle de una compra ─────────────────────────────────────────────────
  async findOne(id: string): Promise<SupplierPurchase> {
    const purchase = await this.purchaseRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!purchase) throw new NotFoundException(`Compra ${id} no encontrada`);
    return purchase;
  }

  // ── Historial de compras por inventario ───────────────────────────────────
  async findByInventory(inventoryId: string, query: QueryPurchaseDto) {
    const [inventory] = await this.dataSource.query(
      `SELECT id FROM inventories WHERE id = $1 AND deleted_at IS NULL`,
      [inventoryId],
    );
    if (!inventory) throw new NotFoundException(`Inventario ${inventoryId} no encontrado`);

    const { page = 1, limit = 20, order = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.purchaseRepo.findAndCount({
      where: { inventoryId },
      relations: ['items'],
      order: { createdAt: order },
      skip,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Vista previa para formulario de reabastecimiento ──────────────────────
  async getRestockPreview(inventoryId: string) {
    const [inventory] = await this.dataSource.query(
      `SELECT * FROM inventories WHERE id = $1 AND deleted_at IS NULL`,
      [inventoryId],
    );
    if (!inventory) throw new NotFoundException(`Inventario ${inventoryId} no encontrado`);

    const details = await this.dataSource.query(
      `SELECT * FROM inventory_details WHERE inventory_id = $1`,
      [inventoryId],
    );

    return { inventory, details };
  }

  // ── Upload de factura ─────────────────────────────────────────────────────
  // TODO: Reemplazar el placeholder con la integración real a S3/almacenamiento
  async uploadInvoice(file: Express.Multer.File) {
    const ALLOWED_MIME = ['image/png', 'image/jpeg', 'application/pdf'];
    const MAX_BYTES    = 10 * 1024 * 1024; // 10 MB — RN-021

    if (!file) {
      throw new BadRequestException('Se requiere un archivo');
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Formato no permitido. Use PNG, JPG o PDF.');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('El archivo excede el tamaño máximo de 10 MB.');
    }

    const year  = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const ext   = path.extname(file.originalname);
    const key   = `invoices/${year}/${month}/${randomUUID()}${ext}`;

    // ⚠ Placeholder — integrar con S3 / MinIO aquí:
    // const invoiceUrl = await this.storageService.upload(key, file.buffer, file.mimetype);
    const invoiceUrl = `https://storage.erp.com/${key}`;

    return {
      invoiceUrl,
      fileName:  file.originalname,
      mimeType:  file.mimetype,
      sizeBytes: file.size,
    };
  }

  // ── T1: Crear compra NUEVO_PRODUCTO ───────────────────────────────────────
  async createNuevoProducto(
    dto: CreateNewProductPurchaseDto,
    userId: string,
  ): Promise<SupplierPurchase> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // RN-024
      await this.validateActiveSupplier(qr, dto.supplierId);
      await this.validateCategory(qr, dto.categoryId);

      // Último caso borde: variantes duplicadas (misma talla+color)
      this.validateDuplicateVariants(dto.variants);

      const totalQuantity = dto.variants.reduce((s, v) => s + v.quantity, 0);
      const totalAmount   = dto.variants.reduce((s, v) => s + v.quantity * v.unitCost, 0);

      // RN-029: detección de doble envío
      await this.checkDuplicatePurchase(qr, userId, dto.supplierId, totalAmount);

      // RN-006: generar SKUs con reintento
      const skus = await this.generateSkusForVariants(qr, dto.productName, dto.variants.length);

      // ── Paso 1: INSERT supplier_purchases ──
      const purchase = qr.manager.create(SupplierPurchase, {
        supplierId:    dto.supplierId,
        type:          PurchaseType.NUEVO_PRODUCTO,
        productName:   dto.productName,
        totalAmount,
        totalQuantity,
        invoiceUrl:    dto.invoiceUrl ?? null,
        status:        PurchaseStatus.COMPLETED,
        inventoryId:   null,
        createdBy:     userId,
      });
      const savedPurchase = await qr.manager.save(SupplierPurchase, purchase);

      // ── Paso 2: INSERT supplier_purchase_items ──
      const items = dto.variants.map((v, i) =>
        qr.manager.create(SupplierPurchaseItem, {
          purchaseId:        savedPurchase.id,
          sku:               skus[i],
          size:              v.size,
          color:             v.color,
          quantity:          v.quantity,
          unitCost:          v.unitCost,
          subtotal:          v.quantity * v.unitCost,
          inventoryDetailId: null,
        }),
      );
      const savedItems = await qr.manager.save(SupplierPurchaseItem, items);

      // ── Paso 3: INSERT inventories ──
      // ⚠ Ajustar columnas según la entity definitiva del Módulo 5
      const [inventory] = await qr.query(
        `INSERT INTO inventories
           (product_name, category_id, brand, main_image_url, supplier_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [dto.productName, dto.categoryId, dto.brand,
         dto.mainImageUrl ?? null, dto.supplierId, userId],
      );

      // ── Paso 4: INSERT inventory_details (una por variante) ──
      const inventoryDetailIds: string[] = [];

      for (let i = 0; i < dto.variants.length; i++) {
        const v = dto.variants[i];
        // ⚠ Ajustar columnas según la entity definitiva del Módulo 6
        const [detail] = await qr.query(
          `INSERT INTO inventory_details
             (inventory_id, sku, size, color, stock, unit_cost)
           VALUES ($1,$2,$3,$4,$5,$6)
           RETURNING *`,
          [inventory.id, skus[i], v.size, v.color, v.quantity, v.unitCost],
        );
        inventoryDetailIds.push(detail.id);
      }

      // ── Paso 5: INSERT inventory_movements (tipo NUEVO_PRODUCTO) ──
      for (let i = 0; i < dto.variants.length; i++) {
        await qr.query(
          `INSERT INTO inventory_movements
             (inventory_detail_id, type, quantity, unit_cost, created_by)
           VALUES ($1,$2,$3,$4,$5)`,
          [inventoryDetailIds[i], 'NUEVO_PRODUCTO',
           dto.variants[i].quantity, dto.variants[i].unitCost, userId],
        );
      }

      // ── Paso 6: UPDATE supplier_purchases SET inventory_id ──
      await qr.manager.update(SupplierPurchase, savedPurchase.id, {
        inventoryId: inventory.id,
      });

      // Enlazar cada item con su inventory_detail
      for (let i = 0; i < savedItems.length; i++) {
        await qr.manager.update(SupplierPurchaseItem, savedItems[i].id, {
          inventoryDetailId: inventoryDetailIds[i],
        });
      }

      await qr.commitTransaction();
      return this.findOne(savedPurchase.id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ── T2: Crear compra REABASTECIMIENTO ─────────────────────────────────────
  async createReabastecimiento(
    dto: CreateRestockPurchaseDto,
    userId: string,
  ): Promise<SupplierPurchase> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // RN-024
      await this.validateActiveSupplier(qr, dto.supplierId);

      // RN-025: inventario existente y activo
      const [inventory] = await qr.query(
        `SELECT * FROM inventories WHERE id = $1 AND deleted_at IS NULL`,
        [dto.inventoryId],
      );
      if (!inventory) {
        throw new NotFoundException(
          `Inventario ${dto.inventoryId} no encontrado o inactivo`,
        );
      }

      const totalQuantity = dto.variants.reduce((s, v) => s + v.quantity, 0);
      const totalAmount   = dto.variants.reduce((s, v) => s + v.quantity * v.unitCost, 0);

      // RN-029
      await this.checkDuplicatePurchase(qr, userId, dto.supplierId, totalAmount);

      // Validar pertenencia + SELECT FOR UPDATE (RN-003, Transacción T2)
      const detailIds = dto.variants.map(v => v.inventoryDetailId);
      const lockedDetails = await this.validateAndLockInventoryDetails(
        qr, dto.inventoryId, detailIds,
      );

      // ── Paso 1: INSERT supplier_purchases ──
      const purchase = qr.manager.create(SupplierPurchase, {
        supplierId:    dto.supplierId,
        type:          PurchaseType.REABASTECIMIENTO,
        productName:   inventory.product_name,
        totalAmount,
        totalQuantity,
        invoiceUrl:    dto.invoiceUrl ?? null,
        status:        PurchaseStatus.COMPLETED,
        inventoryId:   dto.inventoryId,
        createdBy:     userId,
      });
      const savedPurchase = await qr.manager.save(SupplierPurchase, purchase);

      // ── Paso 2: INSERT supplier_purchase_items ──
      const items = dto.variants.map(v => {
        const detail = lockedDetails.find(d => d.id === v.inventoryDetailId)!;
        return qr.manager.create(SupplierPurchaseItem, {
          purchaseId:        savedPurchase.id,
          sku:               detail.sku,
          size:              detail.size,
          color:             detail.color,
          quantity:          v.quantity,
          unitCost:          v.unitCost,
          subtotal:          v.quantity * v.unitCost,
          inventoryDetailId: v.inventoryDetailId,
        });
      });
      await qr.manager.save(SupplierPurchaseItem, items);

      // ── Paso 3: UPDATE inventory_details stock (SELECT FOR UPDATE ya aplicado) ──
      for (const v of dto.variants) {
        await qr.query(
          `UPDATE inventory_details
           SET stock = stock + $1, unit_cost = $2
           WHERE id = $3`,
          [v.quantity, v.unitCost, v.inventoryDetailId],
        );
      }

      // ── Paso 4: INSERT inventory_movements (tipo REABASTECIMIENTO) ──
      for (const v of dto.variants) {
        await qr.query(
          `INSERT INTO inventory_movements
             (inventory_detail_id, type, quantity, unit_cost, created_by)
           VALUES ($1,$2,$3,$4,$5)`,
          [v.inventoryDetailId, 'REABASTECIMIENTO', v.quantity, v.unitCost, userId],
        );
      }

      await qr.commitTransaction();
      return this.findOne(savedPurchase.id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ── T3: Soft delete con movimientos de ajuste compensatorios ─────────────
  async softDelete(id: string, userId: string): Promise<void> {
    const purchase = await this.findOne(id);

    // Pre-validación fuera de transacción: ningún stock debe quedar negativo
    for (const item of purchase.items) {
      if (!item.inventoryDetailId) continue;

      const [detail] = await this.dataSource.query(
        `SELECT stock FROM inventory_details WHERE id = $1`,
        [item.inventoryDetailId],
      );

      if (detail && Number(detail.stock) - item.quantity < 0) {
        throw new UnprocessableEntityException(
          `No se puede eliminar: la variante SKU ${item.sku} quedaría con stock negativo`,
        );
      }
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Paso 1: Soft delete
      await qr.manager.softDelete(SupplierPurchase, id);

      // Pasos 2-3: AJUSTE compensatorio por variante
      for (const item of purchase.items) {
        if (!item.inventoryDetailId) continue;

        // SELECT FOR UPDATE para evitar race condition
        const [detail] = await qr.query(
          `SELECT stock FROM inventory_details WHERE id = $1 FOR UPDATE`,
          [item.inventoryDetailId],
        );

        if (!detail) continue;

        const newStock = Number(detail.stock) - item.quantity;
        if (newStock < 0) {
          // Doble verificación dentro de la transacción
          throw new UnprocessableEntityException(
            `Stock negativo detectado para variante ${item.sku}`,
          );
        }

        await qr.query(
          `UPDATE inventory_details SET stock = $1 WHERE id = $2`,
          [newStock, item.inventoryDetailId],
        );

        await qr.query(
          `INSERT INTO inventory_movements
             (inventory_detail_id, type, quantity, unit_cost, created_by)
           VALUES ($1,'AJUSTE',$2,$3,$4)`,
          [-item.quantity, item.unitCost, userId, item.inventoryDetailId],
        );
      }

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  /** RN-024 */
  private async validateActiveSupplier(qr: QueryRunner, supplierId: string): Promise<void> {
    const [supplier] = await qr.query(
      `SELECT id, deleted_at FROM suppliers WHERE id = $1`,
      [supplierId],
    );
    if (!supplier)           throw new NotFoundException(`Proveedor ${supplierId} no encontrado`);
    if (supplier.deleted_at) throw new NotFoundException('El proveedor ya no está activo');
  }

  private async validateCategory(qr: QueryRunner, categoryId: string): Promise<void> {
    const [category] = await qr.query(
      `SELECT id FROM categories WHERE id = $1`,
      [categoryId],
    );
    if (!category) throw new NotFoundException(`Categoría ${categoryId} no encontrada`);
  }

  /** RN-029: mismo usuario + mismo proveedor + mismo total en < 30 s */
  private async checkDuplicatePurchase(
    qr: QueryRunner,
    userId: string,
    supplierId: string,
    totalAmount: number,
  ): Promise<void> {
    const since = new Date(Date.now() - 30_000);
    const duplicate = await qr.manager
      .createQueryBuilder(SupplierPurchase, 'p')
      .where('p.created_by = :userId',        { userId })
      .andWhere('p.supplier_id = :supplierId', { supplierId })
      .andWhere('p.total_amount = :total',     { total: totalAmount })
      .andWhere('p.created_at >= :since',      { since })
      .getOne();

    if (duplicate) {
      throw new ConflictException(
        'Posible doble envío detectado. El mismo usuario ya registró una compra '
        + 'idéntica en los últimos 30 segundos.',
      );
    }
  }

  /** Último caso borde de la sección 4.9: variantes con misma talla+color */
  private validateDuplicateVariants(
    variants: Array<{ size: string; color: string }>,
  ): void {
    const seen = new Set<string>();
    for (const v of variants) {
      const key = `${v.size.toLowerCase()}-${v.color.toLowerCase()}`;
      if (seen.has(key)) {
        throw new UnprocessableEntityException(
          `Variante duplicada: talla "${v.size}" y color "${v.color}" aparecen más de una vez`,
        );
      }
      seen.add(key);
    }
  }

  /**
   * RN-006: genera SKUs con hasta 5 reintentos por colisión.
   * Formato: PREFIJO-YYYYMMDD-NNN
   */
  private async generateSkusForVariants(
    qr: QueryRunner,
    productName: string,
    count: number,
  ): Promise<string[]> {
    const skus: string[] = [];

    for (let i = 0; i < count; i++) {
      let sku: string | null = null;
      let attempts = 0;

      while (attempts < 5) {
        const candidate = this.buildSku(productName, i + attempts * 1000);
        const [existing] = await qr.query(
          `SELECT id FROM supplier_purchase_items WHERE sku = $1 LIMIT 1`,
          [candidate],
        );
        if (!existing) { sku = candidate; break; }
        attempts++;
      }

      if (!sku) {
        throw new InternalServerErrorException(
          `No se pudo generar un SKU único para la variante ${i + 1} tras 5 intentos`,
        );
      }

      skus.push(sku);
    }

    return skus;
  }

  /** RN-006: PREFIJO-TIMESTAMP-VARIANTE */
  private buildSku(productName: string, index: number): string {
    const prefix    = productName.substring(0, 3).toUpperCase()
                        .replace(/[^A-Z]/g, 'X').padEnd(3, 'X');
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const variant   = String(index + 1).padStart(3, '0');
    return `${prefix}-${timestamp}-${variant}`;
  }

  /**
   * Valida que cada inventoryDetailId pertenece al inventoryId indicado
   * y adquiere SELECT FOR UPDATE (T2, paso 3).
   */
  private async validateAndLockInventoryDetails(
    qr: QueryRunner,
    inventoryId: string,
    detailIds: string[],
  ): Promise<any[]> {
    const details: any[] = [];

    for (const detailId of detailIds) {
      const [detail] = await qr.query(
        `SELECT * FROM inventory_details WHERE id = $1 FOR UPDATE`,
        [detailId],
      );

      if (!detail) {
        throw new NotFoundException(`Detalle de inventario ${detailId} no encontrado`);
      }
      if (detail.inventory_id !== inventoryId) {
        throw new ConflictException(
          `El detalle ${detailId} no pertenece al inventario ${inventoryId}`,
        );
      }

      details.push(detail);
    }

    return details;
  }
}