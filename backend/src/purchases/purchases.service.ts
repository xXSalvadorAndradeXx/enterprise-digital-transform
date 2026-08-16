// src/purchases/purchases.service.ts
import {
  Injectable, NotFoundException, BadRequestException,
  ConflictException, UnprocessableEntityException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { randomUUID } from 'crypto';
import * as path from 'path';

import { SupplierPurchase }          from './entities/supplier-purchase.entity';
import { SupplierPurchaseItem }       from './entities/supplier-purchase-item.entity';
import { CreateNewProductPurchaseDto } from './dto/create-new-product-purchase.dto';
import { CreateRestockPurchaseDto }    from './dto/create-restock-purchase.dto';
import { QueryPurchaseDto }            from './dto/query-purchase.dto';
import { PurchaseStatus }  from './enums/purchase-status.enum';
import { PurchaseType }    from './enums/purchase-type.enum';
import {
  PurchaseResponseDto,
  PurchaseItemResponseDto,
  SupplierSummaryDto,
  UserSummaryDto,
  PaginatedPurchaseResponseDto,
} from './dto/purchase-response.dto';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(SupplierPurchase)
    private readonly purchaseRepo: Repository<SupplierPurchase>,
    @InjectRepository(SupplierPurchaseItem)
    private readonly itemRepo: Repository<SupplierPurchaseItem>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Listado con filtros, relaciones y paginación ─────────────────────────
  async findAll(query: QueryPurchaseDto): Promise<PaginatedPurchaseResponseDto> {
    const {
      type, supplierId, dateFrom, dateTo, search,
      sortBy = 'created_at', order = 'DESC',
      includeDeleted = false,
      page = 1, limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    // ── CORREGIDO: se añaden joins con supplier y createdByUser ─────────────
    const qb = this.purchaseRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.items',         'items')
      .leftJoinAndSelect('p.supplier',      'supplier')
      .leftJoinAndSelect('p.createdByUser', 'createdByUser')
      .orderBy(`p.${sortBy}`, order)
      .skip(skip)
      .take(limit);

    if (includeDeleted) qb.withDeleted();
    if (type)           qb.andWhere('p.type = :type', { type });
    if (supplierId)     qb.andWhere('p.supplierId = :supplierId', { supplierId });

    // ── CORREGIDO: búsqueda por referencia, proveedor y producto ────────────
    if (search) {
      qb.andWhere(
        '(p.productName ILIKE :search OR p.reference ILIKE :search OR supplier.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (dateFrom) qb.andWhere('p.purchaseDate >= :dateFrom', { dateFrom });
    if (dateTo)   qb.andWhere('p.purchaseDate <= :dateTo',   { dateTo });

    // ── CORREGIDO: tabla vacía devuelve [] con HTTP 200, nunca 500 ──────────
    const [purchases, total] = await qb.getManyAndCount();

    return {
      data: purchases.map((p) => this.mapToResponseDto(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Detalle de una compra ─────────────────────────────────────────────────
  async findOne(id: string): Promise<SupplierPurchase> {
    const purchase = await this.purchaseRepo.findOne({
      where: { id },
      relations: ['items', 'supplier', 'createdByUser'],
    });
    if (!purchase) throw new NotFoundException(`Compra ${id} no encontrada`);
    return purchase;
  }

  // ── Detalle mapeado a contrato ────────────────────────────────────────────
  async findOneDto(id: string): Promise<PurchaseResponseDto> {
    return this.mapToResponseDto(await this.findOne(id));
  }

  // ── Historial de compras por inventario ───────────────────────────────────
  async findByInventory(inventoryId: string, query: QueryPurchaseDto): Promise<PaginatedPurchaseResponseDto> {
    const [inventory] = await this.dataSource.query(
      `SELECT id FROM inventories WHERE id = $1 AND deleted_at IS NULL`,
      [inventoryId],
    );
    if (!inventory) throw new NotFoundException(`Inventario ${inventoryId} no encontrado`);

    const { page = 1, limit = 20, order = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const qb = this.purchaseRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.items',         'items')
      .leftJoinAndSelect('p.supplier',      'supplier')
      .leftJoinAndSelect('p.createdByUser', 'createdByUser')
      .where('p.inventoryId = :inventoryId', { inventoryId })
      .orderBy('p.createdAt', order)
      .skip(skip)
      .take(limit);

    const [purchases, total] = await qb.getManyAndCount();

    return {
      data: purchases.map((p) => this.mapToResponseDto(p)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Selector de inventarios para formulario de reabastecimiento ──────────
  // GET /api/v1/purchases/inventory-options?search=camisa
  async getInventoryOptions(search?: string) {
    const param  = search ? `%${search}%` : '%';
    const rows   = await this.dataSource.query(
      `SELECT i.id, i.product_name AS "productName", d.sku
       FROM inventories i
       LEFT JOIN LATERAL (
         SELECT sku FROM inventory_details
         WHERE inventory_id = i.id
         ORDER BY created_at ASC LIMIT 1
       ) d ON TRUE
       WHERE i.deleted_at IS NULL
         AND (i.product_name ILIKE $1)
       ORDER BY i.product_name ASC
       LIMIT 50`,
      [param],
    );
    return { statusCode: 200, data: rows };
  }

  // ── Vista previa para formulario de reabastecimiento ─────────────────────
  // GET /api/v1/purchases/inventory/:inventoryId/preview-restock
  async getRestockPreview(inventoryId: string) {
    const [inventory] = await this.dataSource.query(
      `SELECT i.id, i.product_name AS "productName", i.brand,
              c.id AS "categoryId", c.name AS "categoryName"
       FROM inventories i
       LEFT JOIN categories c ON c.id = i.category_id
       WHERE i.id = $1 AND i.deleted_at IS NULL`,
      [inventoryId],
    );
    if (!inventory) throw new NotFoundException(`Inventario ${inventoryId} no encontrado`);

    // ── CORREGIDO: respuesta con forma del contrato ──────────────────────────
    const details = await this.dataSource.query(
      `SELECT id AS "inventoryDetailId", sku, size, color,
              stock AS "currentStock", unit_cost AS "currentUnitCost"
       FROM inventory_details
       WHERE inventory_id = $1`,
      [inventoryId],
    );

    return {
      statusCode: 200,
      data: {
        inventory: {
          id:          inventory.id,
          productName: inventory.productName,
          brand:       inventory.brand,
          category: {
            id:   inventory.categoryId,
            name: inventory.categoryName,
          },
        },
        details: details.map((d: any) => ({
          inventoryDetailId: d.inventoryDetailId,
          sku:               d.sku,
          size:              d.size,
          color:             d.color,
          currentStock:      Number(d.currentStock),
          currentUnitCost:   Number(d.currentUnitCost),
        })),
      },
    };
  }

  // ── Upload de factura ─────────────────────────────────────────────────────
  // TODO: reemplazar placeholder con S3 / MinIO / disco local
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
      statusCode: 201,
      data: {
        invoiceUrl,
        fileName:  file.originalname,
        mimeType:  file.mimetype,
        sizeBytes: file.size,
      },
    };
  }

  // ── T1: Crear compra NUEVO_PRODUCTO ───────────────────────────────────────
  async createNuevoProducto(
    dto: CreateNewProductPurchaseDto,
    userId: string,
  ): Promise<PurchaseResponseDto> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Validaciones previas
      await this.validateActiveSupplier(qr, dto.supplierId);

      // ── CORREGIDO: categoryId ahora es number ─────────────────────────────
      await this.validateCategory(qr, dto.categoryId);
      this.validateDuplicateVariants(dto.variants);

      const totalQuantity = dto.variants.reduce((s, v) => s + v.quantity, 0);
      const totalAmount   = dto.variants.reduce((s, v) => s + v.quantity * v.unitCost, 0);

      await this.checkDuplicatePurchase(qr, userId, dto.supplierId, totalAmount);

      const skus = await this.generateSkusForVariants(qr, dto.productName, dto.variants.length);

      // ── AÑADIDO: generar referencia única CP-XXXX ─────────────────────────
      const reference = await this.generateReference(qr);

      // ── Paso 1: INSERT supplier_purchases ──────────────────────────────────
      const purchase = qr.manager.create(SupplierPurchase, {
        reference,
        supplierId:   dto.supplierId,
        purchaseDate: dto.purchaseDate,
        type:         PurchaseType.NUEVO_PRODUCTO,
        productName:  dto.productName,
        brand:        dto.brand,
        categoryId:   dto.categoryId,
        gender:       dto.gender ?? null,
        totalAmount,
        totalQuantity,
        invoiceUrl:   dto.invoiceUrl ?? null,
        status:       PurchaseStatus.COMPLETED,
        inventoryId:  null,
        createdBy:    userId,
      });
      const savedPurchase = await qr.manager.save(SupplierPurchase, purchase);

      // ── Paso 2: INSERT supplier_purchase_items ─────────────────────────────
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

      // ── Paso 3: INSERT inventories con purchase_id y gender ────────────────
      const [inventory] = await qr.query(
        `INSERT INTO inventories
           (product_name, category_id, brand, gender, main_image_url,
            supplier_id, purchase_id, created_by, stock)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0)
         RETURNING *`,
        [
          dto.productName,
          dto.categoryId,
          dto.brand,
          dto.gender ?? null,
          dto.mainImageUrl ?? null,
          dto.supplierId,
          savedPurchase.id,   // ── CORREGIDO: se persiste purchase_id ─────────
          userId,
        ],
      );

      // ── Paso 4: INSERT inventory_details con purchase_item_id ──────────────
      const inventoryDetailIds: string[] = [];

      for (let i = 0; i < dto.variants.length; i++) {
        const v = dto.variants[i];
        const [detail] = await qr.query(
          `INSERT INTO inventory_details
             (inventory_id, purchase_item_id, sku, size, color, stock, unit_cost, min_stock)
           VALUES ($1,$2,$3,$4,$5,$6,$7,0)
           RETURNING *`,
          [
            inventory.id,
            savedItems[i].id,   // ── CORREGIDO: se persiste purchase_item_id ──
            skus[i],
            v.size,
            v.color,
            v.quantity,
            v.unitCost,
          ],
        );
        inventoryDetailIds.push(detail.id);

        // ── CORREGIDO: movimiento con tipo 'Entrada', stock_before/after, channel, reference_id ──
        await qr.query(
          `INSERT INTO inventory_movements
             (inventory_detail_id, type, quantity,
              stock_before, stock_after,
              notes, reference_id, channel, created_by)
           VALUES ($1,'Entrada',$2, 0,$3,
                   'Ingreso por compra de producto nuevo',
                   $4,'TIENDA_FISICA',$5)`,
          [detail.id, v.quantity, v.quantity, savedPurchase.id, userId],
        );
      }

      // ── Paso 5: recalcular inventories.stock ──────────────────────────────
      // ── CORREGIDO: antes no se actualizaba, inventario quedaba en 0 ────────
      await qr.query(
        `UPDATE inventories
         SET stock = (
           SELECT COALESCE(SUM(stock), 0)
           FROM inventory_details
           WHERE inventory_id = $1
         )
         WHERE id = $1`,
        [inventory.id],
      );

      // ── Paso 6: enlazar purchase_item ↔ inventory_detail (relación inversa) ─
      for (let i = 0; i < savedItems.length; i++) {
        await qr.manager.update(SupplierPurchaseItem, savedItems[i].id, {
          inventoryDetailId: inventoryDetailIds[i],
        });
      }

      // ── Paso 7: actualizar purchase con inventoryId ────────────────────────
      await qr.manager.update(SupplierPurchase, savedPurchase.id, {
        inventoryId: inventory.id,
      });

      await qr.commitTransaction();
      return this.findOneDto(savedPurchase.id);
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
  ): Promise<PurchaseResponseDto> {
    // ── CORREGIDO: validar que al menos un arreglo tenga elementos ────────────
    const existingVariants = dto.existingVariants ?? [];
    const newVariants      = dto.newVariants      ?? [];

    if (existingVariants.length === 0 && newVariants.length === 0) {
      throw new UnprocessableEntityException(
        'Debe enviar al menos una variante en existingVariants o newVariants',
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      await this.validateActiveSupplier(qr, dto.supplierId);

      const [inventory] = await qr.query(
        `SELECT * FROM inventories WHERE id = $1 AND deleted_at IS NULL`,
        [dto.inventoryId],
      );
      if (!inventory) {
        throw new NotFoundException(`Inventario ${dto.inventoryId} no encontrado o inactivo`);
      }

      // ── CORREGIDO: combinar ambos arreglos para calcular totales ────────────
      const totalQuantity =
        existingVariants.reduce((s, v) => s + v.quantity, 0) +
        newVariants.reduce((s, v) => s + v.quantity, 0);
      const totalAmount =
        existingVariants.reduce((s, v) => s + v.quantity * v.unitCost, 0) +
        newVariants.reduce((s, v) => s + v.quantity * v.unitCost, 0);

      await this.checkDuplicatePurchase(qr, userId, dto.supplierId, totalAmount);

      // Validar y bloquear variantes existentes
      const existingDetailIds = existingVariants.map((v) => v.inventoryDetailId);
      const lockedDetails = existingDetailIds.length > 0
        ? await this.validateAndLockInventoryDetails(qr, dto.inventoryId, existingDetailIds)
        : [];

      // ── AÑADIDO: validar no duplicar talla/color en variantes nuevas ────────
      if (newVariants.length > 0) {
        this.validateDuplicateVariants(newVariants);
        await this.validateNewVariantsDontExist(qr, dto.inventoryId, newVariants);
      }

      const reference = await this.generateReference(qr);

      // ── Paso 1: INSERT supplier_purchases ──────────────────────────────────
      const purchase = qr.manager.create(SupplierPurchase, {
        reference,
        supplierId:   dto.supplierId,
        purchaseDate: dto.purchaseDate,
        type:         PurchaseType.REABASTECIMIENTO,
        productName:  inventory.product_name,
        brand:        inventory.brand,
        categoryId:   inventory.category_id,
        gender:       inventory.gender ?? null,
        totalAmount,
        totalQuantity,
        invoiceUrl:   dto.invoiceUrl ?? null,
        status:       PurchaseStatus.COMPLETED,
        inventoryId:  dto.inventoryId,
        createdBy:    userId,
      });
      const savedPurchase = await qr.manager.save(SupplierPurchase, purchase);

      // ── Paso 2a: procesar variantes EXISTENTES ─────────────────────────────
      for (const v of existingVariants) {
        const detail = lockedDetails.find((d) => d.id === v.inventoryDetailId)!;
        const stockBefore = Number(detail.stock);
        const stockAfter  = stockBefore + v.quantity;

        // Actualizar stock y costo
        await qr.query(
          `UPDATE inventory_details
           SET stock = $1, unit_cost = $2
           WHERE id = $3`,
          [stockAfter, v.unitCost, v.inventoryDetailId],
        );

        // Insertar purchase_item
        const [savedItem] = await qr.query(
          `INSERT INTO supplier_purchase_items
             (purchase_id, sku, size, color, quantity, unit_cost, subtotal, inventory_detail_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           RETURNING *`,
          [
            savedPurchase.id,
            detail.sku, detail.size, detail.color,
            v.quantity, v.unitCost,
            v.quantity * v.unitCost,
            v.inventoryDetailId,
          ],
        );

        // ── CORREGIDO: movimiento con tipo 'Entrada', stock_before/after ──────
        await qr.query(
          `INSERT INTO inventory_movements
             (inventory_detail_id, type, quantity,
              stock_before, stock_after,
              notes, reference_id, channel, created_by)
           VALUES ($1,'Entrada',$2,$3,$4,
                   'Ingreso por reabastecimiento',
                   $5,'TIENDA_FISICA',$6)`,
          [
            v.inventoryDetailId, v.quantity,
            stockBefore, stockAfter,
            savedPurchase.id, userId,
          ],
        );
      }

      // ── Paso 2b: procesar variantes NUEVAS ────────────────────────────────
      if (newVariants.length > 0) {
        const skus = await this.generateSkusForVariants(
          qr, inventory.product_name, newVariants.length,
        );

        for (let i = 0; i < newVariants.length; i++) {
          const v = newVariants[i];

          // Crear inventory_detail nuevo
          const [detail] = await qr.query(
            `INSERT INTO inventory_details
               (inventory_id, sku, size, color, stock, unit_cost, min_stock)
             VALUES ($1,$2,$3,$4,$5,$6,0)
             RETURNING *`,
            [dto.inventoryId, skus[i], v.size, v.color, v.quantity, v.unitCost],
          );

          // Insertar purchase_item
          await qr.query(
            `INSERT INTO supplier_purchase_items
               (purchase_id, sku, size, color, quantity, unit_cost, subtotal, inventory_detail_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              savedPurchase.id,
              skus[i], v.size, v.color,
              v.quantity, v.unitCost,
              v.quantity * v.unitCost,
              detail.id,
            ],
          );

          // Actualizar purchase_item_id en el detail
          await qr.query(
            `UPDATE inventory_details SET purchase_item_id = (
               SELECT id FROM supplier_purchase_items
               WHERE purchase_id = $1 AND sku = $2 LIMIT 1
             ) WHERE id = $3`,
            [savedPurchase.id, skus[i], detail.id],
          );

          // ── CORREGIDO: movimiento con stock_before = 0 ────────────────────
          await qr.query(
            `INSERT INTO inventory_movements
               (inventory_detail_id, type, quantity,
                stock_before, stock_after,
                notes, reference_id, channel, created_by)
             VALUES ($1,'Entrada',$2, 0,$3,
                     'Ingreso por reabastecimiento - nueva variante',
                     $4,'TIENDA_FISICA',$5)`,
            [detail.id, v.quantity, v.quantity, savedPurchase.id, userId],
          );
        }
      }

      // ── Paso 3: recalcular inventories.stock y estado ─────────────────────
      await this.recalcInventoryStock(qr, dto.inventoryId);

      await qr.commitTransaction();
      return this.findOneDto(savedPurchase.id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ── T3: Soft delete con movimientos compensatorios ────────────────────────
  async softDelete(id: string, userId: string): Promise<void> {
    const purchase = await this.findOne(id);

    // Pre-validación fuera de transacción
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
      await qr.manager.softDelete(SupplierPurchase, id);

      for (const item of purchase.items) {
        if (!item.inventoryDetailId) continue;

        const [detail] = await qr.query(
          `SELECT stock FROM inventory_details WHERE id = $1 FOR UPDATE`,
          [item.inventoryDetailId],
        );

        if (!detail) continue;

        const stockBefore = Number(detail.stock);
        const stockAfter  = stockBefore - item.quantity;

        if (stockAfter < 0) {
          throw new UnprocessableEntityException(
            `Stock negativo detectado para variante ${item.sku}`,
          );
        }

        await qr.query(
          `UPDATE inventory_details SET stock = $1 WHERE id = $2`,
          [stockAfter, item.inventoryDetailId],
        );

        // ── CORREGIDO: parámetros ordenados correctamente, tipo 'Salida',
        //    sin unit_cost (no existe en la entidad), con stock_before/after ──
        await qr.query(
          `INSERT INTO inventory_movements
             (inventory_detail_id, type, quantity,
              stock_before, stock_after,
              notes, reference_id, channel, created_by)
           VALUES ($1,'Salida',$2,$3,$4,
                   'Reversión por eliminación de compra',
                   $5,'TIENDA_FISICA',$6)`,
          [
            item.inventoryDetailId,
            item.quantity,
            stockBefore,
            stockAfter,
            id,       // reference_id = id de la compra eliminada
            userId,
          ],
        );
      }

      // Recalcular stock del inventario afectado
      if (purchase.inventoryId) {
        await this.recalcInventoryStock(qr, purchase.inventoryId);
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

  // ── CORREGIDO: recibe number, no string UUID ───────────────────────────────
  private async validateCategory(qr: QueryRunner, categoryId: number): Promise<void> {
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
      .where('p.createdBy = :userId',      { userId })
      .andWhere('p.supplierId = :supplierId', { supplierId })
      .andWhere('p.totalAmount = :total',   { total: totalAmount })
      .andWhere('p.createdAt >= :since',    { since })
      .getOne();

    if (duplicate) {
      throw new ConflictException(
        'Posible doble envío detectado. El mismo usuario ya registró una compra '
        + 'idéntica en los últimos 30 segundos.',
      );
    }
  }

  /** Variantes con misma talla+color en el mismo arreglo */
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

  /** Evita agregar una variante nueva que ya existe en el inventario */
  private async validateNewVariantsDontExist(
    qr: QueryRunner,
    inventoryId: string,
    variants: Array<{ size: string; color: string }>,
  ): Promise<void> {
    for (const v of variants) {
      const [existing] = await qr.query(
        `SELECT id FROM inventory_details
         WHERE inventory_id = $1
           AND LOWER(size) = LOWER($2)
           AND LOWER(color) = LOWER($3)
         LIMIT 1`,
        [inventoryId, v.size, v.color],
      );
      if (existing) {
        throw new ConflictException(
          `La variante talla "${v.size}" / color "${v.color}" ya existe en este inventario. `
          + `Usa existingVariants para reabastecerla.`,
        );
      }
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
          `SELECT id FROM inventory_details WHERE sku = $1 LIMIT 1`,
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
   * Genera referencia legible y única: CP-0001, CP-0002…
   * Bloquea con FOR UPDATE para evitar colisiones concurrentes.
   */
  private async generateReference(qr: QueryRunner): Promise<string> {
    const [row] = await qr.query(
      `SELECT reference FROM supplier_purchases
       WHERE reference IS NOT NULL
       ORDER BY reference DESC
       LIMIT 1
       FOR UPDATE`,
    );

    let nextNumber = 1;
    if (row?.reference) {
      const current = parseInt(row.reference.replace('CP-', ''), 10);
      if (!isNaN(current)) nextNumber = current + 1;
    }

    return `CP-${String(nextNumber).padStart(4, '0')}`;
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

  /** Recalcula inventories.stock como SUM de sus variantes */
  private async recalcInventoryStock(qr: QueryRunner, inventoryId: string): Promise<void> {
    await qr.query(
      `UPDATE inventories
       SET stock = (
         SELECT COALESCE(SUM(stock), 0)
         FROM inventory_details
         WHERE inventory_id = $1
       )
       WHERE id = $1`,
      [inventoryId],
    );
  }

  // ── AÑADIDO: mapper entidad → DTO de respuesta ─────────────────────────────
  private mapToResponseDto(p: SupplierPurchase): PurchaseResponseDto {
    const dto = new PurchaseResponseDto();

    dto.id            = p.id;
    dto.reference     = p.reference ?? '';
    dto.type          = p.type;
    dto.productName   = p.productName;
    dto.brand         = p.brand ?? '';
    dto.categoryId    = p.categoryId ?? 0;
    dto.gender        = p.gender ?? null;
    dto.purchaseDate  = p.purchaseDate ?? '';
    // ── CORREGIDO: Number() convierte los numeric de PostgreSQL que llegan como string ──
    dto.totalAmount   = Number(p.totalAmount);
    dto.totalQuantity = Number(p.totalQuantity);
    dto.invoiceUrl    = p.invoiceUrl;
    dto.status        = p.status;
    dto.inventoryId   = p.inventoryId;
    dto.createdAt     = p.createdAt;
    dto.deletedAt     = p.deletedAt;

    // Relación supplier
    if (p.supplier) {
      const s = new SupplierSummaryDto();
      s.id   = p.supplier.id;
      s.name = (p.supplier as any).name ?? '';
      dto.supplier = s;
    } else {
      dto.supplier = { id: p.supplierId, name: '' };
    }

    // Relación createdBy
    if (p.createdByUser) {
      const u = new UserSummaryDto();
      u.id        = p.createdByUser.id;
      u.firstName = (p.createdByUser as any).firstName ?? '';
      u.lastName  = (p.createdByUser as any).lastName  ?? '';
      dto.createdBy = u;
    } else {
      dto.createdBy = { id: p.createdBy, firstName: '', lastName: '' };
    }

    // Items
    dto.items = (p.items ?? []).map((item) => {
      const i = new PurchaseItemResponseDto();
      i.id       = item.id;
      i.sku      = item.sku;
      i.size     = item.size;
      i.color    = item.color;
      i.quantity = Number(item.quantity);
      i.unitCost = Number(item.unitCost);
      i.subtotal = Number(item.subtotal);
      return i;
    });

    return dto;
  }
}