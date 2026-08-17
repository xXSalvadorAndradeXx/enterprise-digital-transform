// src/inventory/inventory.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { isUUID } from 'class-validator';
import { Inventory }        from './entities/inventory.entity';
import { InventoryDetail }  from './entities/inventory-detail.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product }           from '../products/entities/product.entity';
import { ProductStatus }     from '../products/enums/product-status.enum';
import { InventoryStatus }   from './enums/inventory-status.enum';
import { AdjustStockDto }    from './dto/adjust-stock.dto';
import { QueryMovementsDto } from './dto/query-inventory.dto';
import { MovementType }      from './enums/movement-type.enum';
import { MovementChannel }   from './enums/movement-channel.enum';
import { InventoryRepository }       from './repositories/inventory.repository';
import { InventoryDetailRepository } from './repositories/inventory-detail.repository';
import { InventoryQueryDto }              from './dto/inventory-query.dto';
import { PaginatedInventoryResponseDto }  from './dto/paginated-inventory-response.dto';
import { InventoryWithDetailsResponseDto } from './dto/inventory-with-details-response.dto';
import { InventoryDetailDto }             from './dto/inventory-detail.dto';
import { LowStockResponseDto }            from './dto/low-stock-response.dto';
import { CreateInventoryInternalDto }       from './dto/internal/create-inventory-internal.dto';
import { CreateInventoryDetailInternalDto } from './dto/internal/create-inventory-detail-internal.dto';
import { calculateStockStatus }  from './helpers/stock.helper';
import { PaginatedMovementsResponseDto } from './dto/paginated-movements-response.dto';
import { MovementResponseDto }           from './dto/movement-response.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger('InventoryService');

  constructor(
    private readonly inventoryRepo: InventoryRepository,
    private readonly detailRepo: InventoryDetailRepository,
    @InjectRepository(InventoryMovement)
    private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Hook: pausa automáticamente productos ACTIVE asociados a un inventario
   * cuando éste pasa a OUT_OF_STOCK. Se ejecuta dentro de la misma transacción.
   */
  async checkAndPauseProductsOnOutOfStock(
    inventoryId: string,
    newStatus: InventoryStatus,
    manager: EntityManager,
  ): Promise<void> {
    if (newStatus === InventoryStatus.OUT_OF_STOCK) {
      const result = await manager
        .createQueryBuilder()
        .update(Product)
        .set({ status: ProductStatus.PAUSED })
        .where('inventory_id = :inventoryId', { inventoryId })
        .andWhere('status = :activeStatus', { activeStatus: ProductStatus.ACTIVE })
        .andWhere('deleted_at IS NULL')
        .execute();

      if (result?.affected && result.affected > 0) {
        this.logger.log(
          `Productos pausados por OUT_OF_STOCK en inventario ${inventoryId}`,
        );
      }
    }
  }

  // ── Listado paginado ─────────────────────────────────────────────────────

  async findAll(query: InventoryQueryDto = {}): Promise<PaginatedInventoryResponseDto> {
    try {
      const page  = query.page  ?? 1;
      const limit = query.limit ?? 20;

      query.page  = page;
      query.limit = limit;

      this.logger.log(`findAll query: ${JSON.stringify(query)}`);

      const [inventories, total] = await this.inventoryRepo.findAllPaginated(query);
      const totalPages = Math.ceil(total / limit);

      const data = inventories.map((inv) => ({
        id:                inv.id,
        productName:       inv.productName,
        brand:             inv.brand,
        mainImageUrl:      inv.mainImageUrl,
        status:            inv.status,
        totalStock:        inv.totalStock        ?? 0,
        totalVariants:     inv.totalVariants     ?? 0,
        totalInventoryCost: inv.totalInventoryCost ?? 0,
        createdAt:         inv.createdAt ? inv.createdAt.toISOString() : null,
        category: inv.category
          ? { id: inv.category.id, name: (inv.category as any).nombre ?? (inv.category as any).name ?? '' }
          : null,
        supplier: inv.supplier
          ? { id: inv.supplier.id, name: (inv.supplier as any).name ?? '' }
          : null,
      })) as any;

      return { data, meta: { total, page, limit, totalPages } };
    } catch (error: any) {
      this.logger.error(
        `Error en findAll: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Ocurrió un error interno al consultar el inventario',
      );
    }
  }

  // ── Detalle de un inventario con variantes ───────────────────────────────

  async findOne(id: string): Promise<InventoryWithDetailsResponseDto> {
    this.logger.log(`findOne inventario: ${id}`);

    const inventory = await this.inventoryRepo.findOneWithDetails(id);
    if (!inventory) {
      throw new NotFoundException(`Inventario con ID ${id} no encontrado`);
    }

    const details          = inventory.details ?? [];
    const totalStock       = details.reduce((s, d) => s + Number(d.stock), 0);
    const totalVariants    = details.length;
    const totalInventoryCost = Number(
      details.reduce((s, d) => s + Number(d.stock) * Number(d.unitCost), 0).toFixed(2),
    );

    const mappedInventory = {
      id:                inventory.id,
      productName:       inventory.productName,
      brand:             inventory.brand,
      mainImageUrl:      inventory.mainImageUrl,
      status:            inventory.status,
      totalStock,
      totalVariants,
      totalInventoryCost,
      createdAt: inventory.createdAt ? inventory.createdAt.toISOString() : null,
      category: inventory.category
        ? { id: inventory.category.id, name: (inventory.category as any).nombre ?? (inventory.category as any).name ?? '' }
        : null,
      supplier: inventory.supplier
        ? { id: inventory.supplier.id, name: (inventory.supplier as any).name ?? '' }
        : null,
    } as any;

    const mappedDetails = details.map((d) => ({
      id:          d.id,
      sku:         d.sku,
      size:        d.size,
      color:       d.color,
      stock:       d.stock,
      unitCost:    Number(d.unitCost),
      minStock:    d.minStock,
      stockStatus: calculateStockStatus(d.stock, d.minStock),
    }));

    return { ...mappedInventory, details: mappedDetails };
  }

  // ── Variantes de un inventario ───────────────────────────────────────────

  async findDetails(inventoryId: string): Promise<InventoryDetailDto[]> {
    this.logger.log(`findDetails inventario: ${inventoryId}`);

    const inventory = await this.inventoryRepo.findOne({ where: { id: inventoryId } });
    if (!inventory) {
      throw new NotFoundException(`Inventario con ID ${inventoryId} no encontrado`);
    }

    const details = await this.detailRepo.findByInventoryId(inventoryId);

    return details.map((d) => ({
      id:          d.id,
      sku:         d.sku,
      size:        d.size,
      color:       d.color,
      stock:       d.stock,
      unitCost:    Number(d.unitCost),
      minStock:    d.minStock,
      stockStatus: calculateStockStatus(d.stock, d.minStock),
    }));
  }

  // ── Stock bajo ───────────────────────────────────────────────────────────

  async findLowStock(page?: number, limit?: number): Promise<{
    data: LowStockResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const pageNumber  = page  ?? 1;
    const limitNumber = limit ?? 20;

    this.logger.log(`findLowStock page: ${pageNumber}, limit: ${limitNumber}`);

    const [details, total] = await this.detailRepo.findLowStock(pageNumber, limitNumber);
    const totalPages = Math.ceil(total / limitNumber);

    const data: LowStockResponseDto[] = details.map((d) => ({
      id:            d.id,
      sku:           d.sku,
      size:          d.size,
      color:         d.color,
      stock:         d.stock,
      unitCost:      Number(d.unitCost),
      minStock:      d.minStock,
      inventoryName: d.inventory?.productName ?? '',
      stockStatus:   calculateStockStatus(d.stock, d.minStock),
    }));

    return { data, meta: { total, page: pageNumber, limit: limitNumber, totalPages } };
  }

  async findByProduct(productId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepo.findOne({ where: { productId } });
    if (!inventory) {
      throw new NotFoundException(`Inventario para producto ${productId} no encontrado`);
    }
    return inventory;
  }

  // ── Movimientos ──────────────────────────────────────────────────────────

  async findMovements(query: QueryMovementsDto): Promise<PaginatedMovementsResponseDto> {
    const {
      search, dateFrom, dateTo, channel,
      responsibleUserId, productId, inventoryDetailId,
      type, page = 1, limit = 20,
    } = query;

    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to   = new Date(dateTo);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        throw new BadRequestException('Formato de fecha inválido en dateFrom o dateTo');
      }
      if (from > to) {
        throw new BadRequestException('dateFrom no puede ser posterior a dateTo');
      }
    }

    const skip = (page - 1) * limit;

    const qb = this.movementRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.product',         'product')
      .leftJoinAndSelect('m.createdBy',        'createdBy')
      .leftJoinAndSelect('m.inventoryDetail', 'inventoryDetail')
      .orderBy('m.createdAt', 'DESC');

    // ── CORREGIDO: búsqueda por nombre del producto en la relación inventory
    // cuando no hay product_id (compra sin producto publicado aún) se busca
    // a través de inventoryDetail → inventory → product_name
    if (search?.trim()) {
      qb.leftJoin('inventoryDetail.inventory', 'inv')
        .andWhere(
          '(product.commercialName ILIKE :search OR inv.productName ILIKE :search)',
          { search: `%${search.trim()}%` },
        );
    }

    if (dateFrom) {
      const from = dateFrom.includes('T')
        ? new Date(dateFrom)
        : new Date(`${dateFrom}T00:00:00.000Z`);
      qb.andWhere('m.createdAt >= :dateFrom', { dateFrom: from });
    }

    if (dateTo) {
      const to = dateTo.includes('T')
        ? new Date(dateTo)
        : new Date(`${dateTo}T23:59:59.999Z`);
      qb.andWhere('m.createdAt <= :dateTo', { dateTo: to });
    }

    if (channel)            qb.andWhere('m.channel = :channel',                           { channel });
    if (responsibleUserId)  qb.andWhere('m.createdById = :responsibleUserId',             { responsibleUserId });
    if (productId)          qb.andWhere('m.productId = :productId',                       { productId });
    if (inventoryDetailId)  qb.andWhere('m.inventoryDetailId = :inventoryDetailId',       { inventoryDetailId });
    if (type)               qb.andWhere('m.type = :type',                                 { type });

    qb.skip(skip).take(limit);

    const [movements, total] = await qb.getManyAndCount();

    const data: MovementResponseDto[] = movements.map((m) => ({
      id:          m.id,
      type:        m.type,
      quantity:    Number(m.quantity),
      stockBefore: Number(m.stockBefore),
      stockAfter:  Number(m.stockAfter),
      notes:       m.notes,
      referenceId: m.referenceId,
      channel:     m.channel,
      createdAt:   m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
      // ── CORREGIDO: product puede ser null (compra sin producto publicado) ──
      product: m.product
        ? { id: m.product.id, commercialName: (m.product as any).commercialName ?? '' }
        : null,
      createdBy: m.createdBy
        ? { id: m.createdBy.id, firstName: m.createdBy.firstName, lastName: m.createdBy.lastName }
        : null,
      inventoryDetail: m.inventoryDetail
        ? { id: m.inventoryDetail.id, sku: m.inventoryDetail.sku, size: m.inventoryDetail.size, color: m.inventoryDetail.color }
        : null,
    }));

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Ajuste manual de stock ───────────────────────────────────────────────

  async adjust(dto: AdjustStockDto, userId: string): Promise<InventoryMovement> {
    // Se debe proporcionar al menos uno de los dos identificadores
    if (!dto.productId && !dto.inventoryDetailId) {
      throw new BadRequestException(
        'Debe proporcionar productId o inventoryDetailId para realizar un ajuste',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      let inventory: Inventory | null = null;

      // ── CORREGIDO: si viene productId, buscar por él; si no, buscar por detail ─
      if (dto.productId) {
        inventory = await manager
          .createQueryBuilder(Inventory, 'inv')
          .setLock('pessimistic_write')
          .where('inv.productId = :productId', { productId: dto.productId })
          .getOne();

        if (!inventory) {
          throw new NotFoundException(
            `Inventario para producto ${dto.productId} no encontrado`,
          );
        }
      }

      if (dto.inventoryDetailId) {
        const detail = await manager
          .createQueryBuilder(InventoryDetail, 'd')
          .setLock('pessimistic_write')
          .where('d.id = :id', { id: dto.inventoryDetailId })
          .getOne();

        if (!detail) {
          throw new NotFoundException(
            `Variante con ID ${dto.inventoryDetailId} no encontrada`,
          );
        }

        const detailBefore = Number(detail.stock);
        const detailAfter  = detailBefore + Number(dto.quantity);

        if (detailAfter < 0) {
          throw new BadRequestException(
            `Stock insuficiente en variante ${detail.sku}. Disponible: ${detailBefore}, solicitado: ${dto.quantity}`,
          );
        }

        detail.stock = detailAfter;
        await manager.save(InventoryDetail, detail);

        // Si no se resolvió el inventario por productId, buscarlo por el detail
        if (!inventory) {
          inventory = await manager.findOne(Inventory, {
            where: { id: detail.inventoryId },
          });
        }
      }

      // Recalcular stock del inventario principal
      if (inventory) {
        await this.recalcAndSaveInventoryStock(inventory.id, manager);
        inventory = await manager.findOne(Inventory, { where: { id: inventory.id } }) ?? inventory;

        if (inventory.status === InventoryStatus.OUT_OF_STOCK) {
          await this.checkAndPauseProductsOnOutOfStock(
            inventory.id,
            InventoryStatus.OUT_OF_STOCK,
            manager,
          );
        }
      }

      // Registrar movimiento
      const movement = manager.create(InventoryMovement, {
        // ── CORREGIDO: productId es nullable ─────────────────────────────────
        productId:         dto.productId         ?? null,
        inventoryDetailId: dto.inventoryDetailId ?? null,
        type:              dto.type,
        quantity:          dto.quantity,
        // Los valores de stock_before/after se toman del detail cuando aplica
        stockBefore: inventory ? Number((inventory as any)._stockBeforeAdjust ?? inventory.stock) : 0,
        stockAfter:  inventory ? Number(inventory.stock) : 0,
        notes:       dto.notes       ?? null,
        referenceId: dto.referenceId ?? null,
        channel:     dto.channel     ?? MovementChannel.TIENDA_FISICA,
        createdById: userId,
      });

      return manager.save(InventoryMovement, movement);
    });
  }

  // ── Recepción de compras (método legacy, mantener por compatibilidad) ─────

  async applyPurchaseReceipt(
    items: { productId: string; quantity: number; inventoryDetailId?: string }[],
    purchaseId: string,
    userId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        let inventory = await manager.findOne(Inventory, {
          where: { productId: item.productId },
        });

        if (!inventory) {
          inventory = manager.create(Inventory, {
            productId: item.productId,
            stock: 0,
            reserved: 0,
          });
        }

        const stockBefore = Number(inventory.stock);
        const stockAfter  = stockBefore + Number(item.quantity);

        inventory.stock = stockAfter;
        await manager.save(Inventory, inventory);

        const movement = manager.create(InventoryMovement, {
          productId:         item.productId,
          inventoryDetailId: item.inventoryDetailId ?? null,
          // ── CORREGIDO: tipo correcto del enum ────────────────────────────
          type:        MovementType.IN,
          quantity:    item.quantity,
          stockBefore,
          stockAfter,
          notes:       'Recepción de orden de compra',
          referenceId: purchaseId,
          channel:     MovementChannel.TIENDA_FISICA,
          createdById: userId,
        });

        await manager.save(InventoryMovement, movement);
      }
    });
  }

  // ── Inicializar inventario para un producto nuevo ─────────────────────────

  async initForProduct(productId: string): Promise<Inventory> {
    const existing = await this.inventoryRepo.findOne({ where: { productId } });
    if (existing) return existing;

    const inventory = this.inventoryRepo.create({ productId, stock: 0, reserved: 0 });
    return this.inventoryRepo.save(inventory);
  }

  // ── Métodos internos para PurchasesModule ────────────────────────────────

  /**
   * Crea y persiste un nuevo inventario dentro de la transacción proporcionada.
   * Uso exclusivo del PurchasesModule.
   */
  async createInventory(
    data: CreateInventoryInternalDto,
    manager: EntityManager,
  ): Promise<Inventory> {
    this.logger.log(`createInventory interno para: ${data.productName}`);

    if (data.purchaseId && !isUUID(data.purchaseId)) {
      throw new BadRequestException('purchase_id debe ser un UUID válido');
    }
    if (data.supplierId && !isUUID(data.supplierId)) {
      throw new BadRequestException('supplier_id debe ser un UUID válido');
    }

    const inventory = manager.create(Inventory, data);
    return manager.save(Inventory, inventory);
  }

  /**
   * Crea y persiste una variante dentro de la transacción proporcionada.
   * Uso exclusivo del PurchasesModule.
   */
  async createInventoryDetail(
    inventoryId: string,
    data: CreateInventoryDetailInternalDto,
    manager: EntityManager,
  ): Promise<InventoryDetail> {
    this.logger.log(`createInventoryDetail SKU: ${data.sku} para inventario: ${inventoryId}`);

    if (data.purchaseItemId && !isUUID(data.purchaseItemId)) {
      throw new BadRequestException('purchase_item_id debe ser un UUID válido');
    }

    // RN-I-008: unicidad de SKU
    const existingSku = await manager.findOne(InventoryDetail, { where: { sku: data.sku } });
    if (existingSku) {
      this.logger.warn(`[RN-I-008] SKU duplicado: ${data.sku}`);
      throw new ConflictException(`El SKU ${data.sku} ya está registrado`);
    }

    const detail = manager.create(InventoryDetail, { ...data, inventoryId });
    return manager.save(InventoryDetail, detail);
  }

  /**
   * Actualiza el stock de una variante dentro de una transacción.
   * Aplica RN-I-003 con bloqueo pesimista para evitar stock negativo.
   * Uso exclusivo del PurchasesModule.
   */
  async updateStock(
    inventoryDetailId: string,
    delta: number,
    manager: EntityManager,
  ): Promise<void> {
    if (delta > 0) {
      this.logger.log(`+${delta} stock para variante ${inventoryDetailId}`);
      await manager.increment(InventoryDetail, { id: inventoryDetailId }, 'stock', delta);
      return;
    }

    if (delta < 0) {
      this.logger.log(`${delta} stock para variante ${inventoryDetailId}`);

      const detail = await manager
        .createQueryBuilder(InventoryDetail, 'detail')
        .setLock('pessimistic_write')
        .where('detail.id = :id', { id: inventoryDetailId })
        .getOne();

      if (!detail) {
        throw new NotFoundException(
          `Detalle de inventario ${inventoryDetailId} no encontrado`,
        );
      }

      const newStock = detail.stock + delta;

      // RN-I-003
      if (newStock < 0) {
        this.logger.warn(
          `[RN-I-003] Stock insuficiente para variante ${inventoryDetailId}. Actual: ${detail.stock}, delta: ${delta}`,
        );
        throw new ConflictException('Stock insuficiente para ejecutar esta operación');
      }

      detail.stock = newStock;
      await manager.save(InventoryDetail, detail);

      // Recalcular y pausar si queda sin stock
      await this.recalcAndSaveInventoryStock(detail.inventoryId, manager);
      const inventory = await manager.findOne(Inventory, { where: { id: detail.inventoryId } });
      if (inventory?.status === InventoryStatus.OUT_OF_STOCK) {
        await this.checkAndPauseProductsOnOutOfStock(
          inventory.id,
          InventoryStatus.OUT_OF_STOCK,
          manager,
        );
      }
    }
  }

  // ── Helpers privados ─────────────────────────────────────────────────────

  /**
   * Recalcula inventories.stock = SUM(inventory_details.stock) y actualiza
   * el status (ACTIVE / OUT_OF_STOCK) según el resultado.
   */
  private async recalcAndSaveInventoryStock(
    inventoryId: string,
    manager: EntityManager,
  ): Promise<void> {
    const allDetails = await manager.find(InventoryDetail, { where: { inventoryId } });
    const totalStock = allDetails.reduce((s, d) => s + Number(d.stock), 0);

    const inventory = await manager.findOne(Inventory, { where: { id: inventoryId } });
    if (!inventory) return;

    inventory.stock  = totalStock;
    inventory.status = totalStock <= 0
      ? InventoryStatus.OUT_OF_STOCK
      : InventoryStatus.ACTIVE;

    await manager.save(Inventory, inventory);
  }
}