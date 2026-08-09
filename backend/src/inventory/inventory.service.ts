// backend\src\inventory\inventory.service.ts
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
import { Inventory } from './entities/inventory.entity';
import { InventoryDetail } from './entities/inventory-detail.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { QueryMovementsDto } from './dto/query-inventory.dto';
import { MovementType } from './enums/movement-type.enum';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryDetailRepository } from './repositories/inventory-detail.repository';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { PaginatedInventoryResponseDto } from './dto/paginated-inventory-response.dto';
import { InventoryWithDetailsResponseDto } from './dto/inventory-with-details-response.dto';
import { InventoryDetailDto } from './dto/inventory-detail.dto';
import { LowStockResponseDto } from './dto/low-stock-response.dto';
import { CreateInventoryInternalDto } from './dto/internal/create-inventory-internal.dto';
import { CreateInventoryDetailInternalDto } from './dto/internal/create-inventory-detail-internal.dto';
import { calculateStockStatus } from './helpers/stock.helper';
import { PaginatedMovementsResponseDto } from './dto/paginated-movements-response.dto';
import { MovementResponseDto } from './dto/movement-response.dto';

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

  // ── Stock actual ────────────────────────────────────────────────────────

  async findAll(
    query: InventoryQueryDto = {},
  ): Promise<PaginatedInventoryResponseDto> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;

      this.logger.log(`Iniciando findAll con query: ${JSON.stringify(query)}`);

      query.page = page;
      query.limit = limit;

      const [inventories, total] =
        await this.inventoryRepo.findAllPaginated(query);

      const totalPages = Math.ceil(total / limit);

      const data = inventories.map((inv) => ({
        id: inv.id,
        productName: inv.productName,
        brand: inv.brand,
        mainImageUrl: inv.mainImageUrl,
        status: inv.status,
        totalStock: inv.totalStock ?? 0,
        totalVariants: inv.totalVariants ?? 0,
        createdAt: inv.createdAt ? inv.createdAt.toISOString() : null,
        category: inv.category
          ? { id: inv.category.id, name: inv.category.nombre }
          : null,
        supplier: inv.supplier
          ? { id: inv.supplier.id, name: inv.supplier.name }
          : null,
      })) as any;

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Error en findAll al obtener inventarios paginados: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Ocurrió un error interno al consultar el inventario',
      );
    }
  }

  async findOne(id: string): Promise<InventoryWithDetailsResponseDto> {
    this.logger.log(`Buscando inventario con ID: ${id}`);

    const inventory = await this.inventoryRepo.findOneWithDetails(id);

    if (!inventory) {
      throw new NotFoundException(`Inventario con ID ${id} no encontrado`);
    }

    const details = inventory.details || [];
    const totalStock = details.reduce((sum, d) => sum + Number(d.stock), 0);
    const totalVariants = details.length;

    const mappedInventory = {
      id: inventory.id,
      productName: inventory.productName,
      brand: inventory.brand,
      mainImageUrl: inventory.mainImageUrl,
      status: inventory.status,
      totalStock,
      totalVariants,
      createdAt: inventory.createdAt ? inventory.createdAt.toISOString() : null,
      category: inventory.category
        ? { id: inventory.category.id, name: inventory.category.nombre }
        : null,
      supplier: inventory.supplier
        ? { id: inventory.supplier.id, name: inventory.supplier.name }
        : null,
    } as any;

    const mappedDetails = details.map((detail) => ({
      id: detail.id,
      sku: detail.sku,
      size: detail.size,
      color: detail.color,
      stock: detail.stock,
      unitCost: Number(detail.unitCost),
      minStock: detail.minStock,
      // RN-I-004
      stockStatus: calculateStockStatus(detail.stock, detail.minStock),
    }));

    return {
      ...mappedInventory,
      details: mappedDetails,
    };
  }

  // RN-I-010
  async findDetails(inventoryId: string): Promise<InventoryDetailDto[]> {
    this.logger.log(
      `Consultando detalles del inventario con ID: ${inventoryId}`,
    );

    const inventory = await this.inventoryRepo.findOne({
      where: { id: inventoryId },
    });
    if (!inventory) {
      throw new NotFoundException(
        `Inventario con ID ${inventoryId} no encontrado`,
      );
    }

    const details = await this.detailRepo.findByInventoryId(inventoryId);

    return details.map((detail) => ({
      id: detail.id,
      sku: detail.sku,
      size: detail.size,
      color: detail.color,
      stock: detail.stock,
      unitCost: Number(detail.unitCost),
      minStock: detail.minStock,
      // RN-I-004
      stockStatus: calculateStockStatus(detail.stock, detail.minStock),
    }));
  }

  async findLowStock(
    page?: number,
    limit?: number,
  ): Promise<{
    data: LowStockResponseDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const pageNumber = page ?? 1;
    const limitNumber = limit ?? 20;

    this.logger.log(
      `Consultando stock bajo - page: ${pageNumber}, limit: ${limitNumber}`,
    );

    const [details, total] = await this.detailRepo.findLowStock(
      pageNumber,
      limitNumber,
    );

    const totalPages = Math.ceil(total / limitNumber);

    const data: LowStockResponseDto[] = details.map((detail) => ({
      id: detail.id,
      sku: detail.sku,
      size: detail.size,
      color: detail.color,
      stock: detail.stock,
      unitCost: Number(detail.unitCost),
      minStock: detail.minStock,
      inventoryName: detail.inventory?.productName || '',
      // RN-I-004
      stockStatus: calculateStockStatus(detail.stock, detail.minStock),
    }));

    return {
      data,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
      },
    };
  }

  async findByProduct(productId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepo.findOne({
      where: { productId },
    });
    if (!inventory)
      throw new NotFoundException(
        `Inventario para producto ${productId} no encontrado`,
      );
    return inventory;
  }

  // ── Movimientos ─────────────────────────────────────────────────────────

  async findMovements(
  query: QueryMovementsDto,
): Promise<PaginatedMovementsResponseDto> {
  const { productId, type, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  this.logger.log(
    `Consultando movimientos - page: ${page}, limit: ${limit}, productId: ${productId ?? 'todos'}, type: ${type ?? 'todos'}`,
  );

  const qb = this.movementRepo
    .createQueryBuilder('m')
    .leftJoinAndSelect('m.product', 'product')
    .leftJoinAndSelect('m.createdBy', 'createdBy')
    .orderBy('m.created_at', 'DESC')
    .skip(skip)
    .take(limit);

  if (productId) qb.andWhere('m.product_id = :productId', { productId });
  if (type) qb.andWhere('m.type = :type', { type });

  const [movements, total] = await qb.getManyAndCount();

  const data: MovementResponseDto[] = movements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: Number(m.quantity),
    stockBefore: Number(m.stockBefore),
    stockAfter: Number(m.stockAfter),
    notes: m.notes,
    referenceId: m.referenceId,
    createdAt: m.createdAt.toISOString(),
    product: m.product
      ? { id: m.product.id, nombre: m.product.nombre }
      : null,
    createdBy: m.createdBy
      ? {
          id: m.createdBy.id,
          firstName: m.createdBy.firstName,
          lastName: m.createdBy.lastName,
        }
      : null,
  }));

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  // ── Ajuste manual ───────────────────────────────────────────────────────

  async adjust(
    dto: AdjustStockDto,
    userId: string,
  ): Promise<InventoryMovement> {
    return this.dataSource.transaction(async (manager) => {
      // Bloquear la fila para evitar race conditions
      const inventory = await manager
        .createQueryBuilder(Inventory, 'inv')
        .setLock('pessimistic_write')
        .where('inv.product_id = :productId', { productId: dto.productId })
        .getOne();

      if (!inventory) {
        throw new NotFoundException(
          `Inventario para producto ${dto.productId} no encontrado`,
        );
      }

      const stockBefore = Number(inventory.stock);
      const stockAfter = stockBefore + Number(dto.quantity);

      if (stockAfter < 0) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${stockBefore}, solicitado: ${dto.quantity}`,
        );
      }

      // Actualizar stock
      inventory.stock = stockAfter;
      await manager.save(Inventory, inventory);

      // Registrar movimiento
      const movement = manager.create(InventoryMovement, {
        productId: dto.productId,
        type: dto.type,
        quantity: dto.quantity,
        stockBefore,
        stockAfter,
        notes: dto.notes ?? null,
        referenceId: dto.referenceId ?? null,
        createdById: userId,
      });

      return manager.save(InventoryMovement, movement);
    });
  }

  // ── Usado por PurchasesService al recibir una compra ───────────────────

  async applyPurchaseReceipt(
    items: { productId: string; quantity: number }[],
    purchaseId: string,
    userId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        let inventory = await manager.findOne(Inventory, {
          where: { productId: item.productId },
        });

        // Si no existe inventario para el producto, crearlo
        if (!inventory) {
          inventory = manager.create(Inventory, {
            productId: item.productId,
            stock: 0,
            reserved: 0,
          });
        }

        const stockBefore = Number(inventory.stock);
        const stockAfter = stockBefore + Number(item.quantity);

        inventory.stock = stockAfter;
        await manager.save(Inventory, inventory);

        const movement = manager.create(InventoryMovement, {
          productId: item.productId,
          type: MovementType.IN,
          quantity: item.quantity,
          stockBefore,
          stockAfter,
          notes: 'Recepción de orden de compra',
          referenceId: purchaseId,
          createdById: userId,
        });

        await manager.save(InventoryMovement, movement);
      }
    });
  }

  // ── Inicializar inventario para un producto nuevo ──────────────────────

  async initForProduct(productId: string): Promise<Inventory> {
    const existing = await this.inventoryRepo.findOne({ where: { productId } });
    if (existing) return existing;

    const inventory = this.inventoryRepo.create({
      productId,
      stock: 0,
      reserved: 0,
    });
    return this.inventoryRepo.save(inventory);
  }

  /**
   * Método de uso interno exclusivo para PurchasesModule.
   * Crea y persiste un nuevo inventario dentro de la transacción del EntityManager proporcionado.
   */
  async createInventory(
    data: CreateInventoryInternalDto,
    manager: EntityManager,
  ): Promise<Inventory> {
    this.logger.log(
      `Creando inventario internamente para producto: ${data.productName}`,
    );

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
   * Método de uso interno exclusivo para PurchasesModule.
   * Crea y persiste una nueva variante de inventario (InventoryDetail) dentro de la transacción del EntityManager proporcionado.
   */
  async createInventoryDetail(
    inventoryId: string,
    data: CreateInventoryDetailInternalDto,
    manager: EntityManager,
  ): Promise<InventoryDetail> {
    this.logger.log(
      `Creando detalle/variante internamente con SKU: ${data.sku} para inventario: ${inventoryId}`,
    );

    if (data.purchaseItemId && !isUUID(data.purchaseItemId)) {
      throw new BadRequestException('purchase_item_id debe ser un UUID válido');
    }

    // RN-I-008: Validación de unicidad de SKU
    // RN-I-008
    const existingSku = await manager.findOne(InventoryDetail, {
      where: { sku: data.sku },
    });

    if (existingSku) {
      this.logger.warn(
        `[RN-I-008] Intento de registro duplicado: El SKU ${data.sku} ya está registrado`,
      );
      throw new ConflictException(`El SKU ${data.sku} ya está registrado`);
    }

    const detail = manager.create(InventoryDetail, {
      ...data,
      inventoryId,
    });

    return manager.save(InventoryDetail, detail);
  }

  /**
   * Método de uso interno exclusivo para PurchasesModule.
   * Actualiza el stock de una variante de inventario (InventoryDetail) dentro de una transacción.
   * Aplica RN-I-003 para prevenir stocks negativos utilizando bloqueo pesimista.
   */
  // RN-I-002
  async updateStock(
    inventoryDetailId: string,
    delta: number,
    manager: EntityManager,
  ): Promise<void> {
    if (delta > 0) {
      this.logger.log(
        `Incrementando stock para variante ${inventoryDetailId} en +${delta}`,
      );
      await manager.increment(
        InventoryDetail,
        { id: inventoryDetailId },
        'stock',
        delta,
      );
      return;
    }

    if (delta < 0) {
      this.logger.log(
        `Decrementando stock para variante ${inventoryDetailId} en ${delta}`,
      );

      // Bloquear el registro con SELECT FOR UPDATE para evitar condiciones de carrera (RN-I-003)
      // RN-I-003
      const detail = await manager
        .createQueryBuilder(InventoryDetail, 'detail')
        .setLock('pessimistic_write')
        .where('detail.id = :id', { id: inventoryDetailId })
        .getOne();

      if (!detail) {
        throw new NotFoundException(
          `Detalle de inventario con ID ${inventoryDetailId} no encontrado`,
        );
      }

      const newStock = detail.stock + delta;

      // RN-I-003: Validación de no negatividad de stock
      // RN-I-003
      if (newStock < 0) {
        this.logger.warn(
          `[RN-I-003] Intento de decremento fallido: Stock insuficiente para variante ${inventoryDetailId}. Stock actual: ${detail.stock}, delta: ${delta}`,
        );
        throw new ConflictException(
          'Stock insuficiente para ejecutar esta operación',
        );
      }

      detail.stock = newStock;
      await manager.save(InventoryDetail, detail);
    }
  }
}