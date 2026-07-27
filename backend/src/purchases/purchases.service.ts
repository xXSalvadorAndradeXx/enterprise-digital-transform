// src/purchases/purchases.service.ts
import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { SupplierPurchase } from './entities/supplier-purchase.entity';
import { SupplierPurchaseItem } from './entities/supplier-purchase-item.entity';
import { PurchaseStatusHistory } from './entities/purchase-status-history.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { QueryPurchaseDto } from './dto/query-purchase.dto';
import { PurchaseStatus } from './enums/purchase-status.enum';
import { PurchaseStateMachine } from './purchase-state-machine';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(SupplierPurchase)
    private readonly purchaseRepo: Repository<SupplierPurchase>,
    @InjectRepository(SupplierPurchaseItem)
    private readonly itemRepo: Repository<SupplierPurchaseItem>,
    @InjectRepository(PurchaseStatusHistory)
    private readonly historyRepo: Repository<PurchaseStatusHistory>,
    private readonly dataSource: DataSource,
  ) {}

  // ── T08: listado con filtros ────────────────────────────────────────────
  async findAll(query: QueryPurchaseDto) {
    const { status, supplierId, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.purchaseRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.items', 'items')
      .orderBy('p.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (status)
      qb.andWhere('p.status = :status', { status });
    if (supplierId)
      qb.andWhere('p.supplier_id = :supplierId', { supplierId });
    if (dateFrom)
      qb.andWhere('p.created_at >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo)
      qb.andWhere('p.created_at <= :dateTo', { dateTo: new Date(dateTo) });

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── T10: detalle con historial ──────────────────────────────────────────
  async findOne(id: string): Promise<SupplierPurchase> {
    const purchase = await this.purchaseRepo.findOne({ where: { id } });
    if (!purchase) throw new NotFoundException(`Compra ${id} no encontrada`);
    return purchase;
  }

  async findOneWithHistory(id: string) {
    const purchase = await this.findOne(id);
    const history  = await this.historyRepo.find({
      where: { purchaseId: id },
      order: { createdAt: 'ASC' },
    });
    return { ...purchase, statusHistory: history };
  }

  // ── T13: historial completo ─────────────────────────────────────────────
  async findHistory(id: string): Promise<PurchaseStatusHistory[]> {
    await this.findOne(id);
    return this.historyRepo.find({
      where: { purchaseId: id },
      order: { createdAt: 'ASC' },
    });
  }

  // ── T03: crear compra ───────────────────────────────────────────────────
  async create(dto: CreatePurchaseDto, userId: string): Promise<SupplierPurchase> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Validar existencia del proveedor
      const supplier = await qr.manager.findOne('suppliers', {
        where: { id: dto.supplierId },
      });
      if (!supplier) throw new NotFoundException(`Proveedor ${dto.supplierId} no encontrado`);

      // Validar existencia de cada producto
      await this.validateProducts(qr, dto.items.map((i) => i.productId));

      // Calcular items y total
      const items = dto.items.map((i) =>
        qr.manager.create(SupplierPurchaseItem, {
          productId: i.productId,
          quantity:  Number(i.quantity),
          unitCost:  Number(i.unitCost),
          subtotal:  Number(i.quantity) * Number(i.unitCost),
        }),
      );

      const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

      const purchase = qr.manager.create(SupplierPurchase, {
        supplierId:  dto.supplierId,
        invoiceUrl:  dto.invoiceUrl ?? null,
        createdBy:   userId,
        totalAmount,
        status:      PurchaseStatus.PENDING,
        items,
      });

      const saved = await qr.manager.save(SupplierPurchase, purchase);

      // Registrar transición inicial en historial
      await this.registerStatusChange(
        qr, saved.id, null, PurchaseStatus.PENDING, userId,
      );

      await qr.commitTransaction();
      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ── T05: editar compra en PENDING ───────────────────────────────────────
  async update(id: string, dto: UpdatePurchaseDto): Promise<SupplierPurchase> {
    const purchase = await this.findOne(id);

    // Solo editable en PENDING — T04
    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden editar compras en estado PENDING',
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      if (dto.invoiceUrl !== undefined) purchase.invoiceUrl = dto.invoiceUrl;

      if (dto.items) {
        await this.validateProducts(qr, dto.items.map((i) => i.productId));

        // Reemplazar líneas completas
        await qr.manager.delete(SupplierPurchaseItem, { purchaseId: id });

        purchase.items = dto.items.map((i) =>
          qr.manager.create(SupplierPurchaseItem, {
            purchaseId: id,
            productId:  i.productId,
            quantity:   Number(i.quantity),
            unitCost:   Number(i.unitCost),
            subtotal:   Number(i.quantity) * Number(i.unitCost),
          }),
        );

        purchase.totalAmount = purchase.items.reduce(
          (sum, i) => sum + i.subtotal, 0,
        );
      }

      const saved = await qr.manager.save(SupplierPurchase, purchase);
      await qr.commitTransaction();
      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ── T12: cambio de estado unificado ────────────────────────────────────
  async changeStatus(
    id: string,
    newStatus: 'RECEIVED' | 'CANCELLED',
    userId: string,
  ): Promise<SupplierPurchase> {
    const purchase = await this.findOne(id);
    const targetStatus = PurchaseStatus[newStatus];

    // T04: validar transición
    PurchaseStateMachine.validateTransition(purchase.status, targetStatus);

    if (targetStatus === PurchaseStatus.RECEIVED) {
      return this.receivePurchase(purchase, userId);
    }

    return this.cancelPurchase(purchase, userId);
  }

  // ── T06: recepción atómica ──────────────────────────────────────────────
  private async receivePurchase(
    purchase: SupplierPurchase,
    userId: string,
  ): Promise<SupplierPurchase> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Actualizar stock de cada producto
      for (const item of purchase.items) {
        const product = await qr.manager.findOne('products', {
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Producto ${item.productId} no encontrado`);
        }

        // Incrementar stock
        await qr.manager.increment(
          'products',
          { id: item.productId },
          'stock',
          Number(item.quantity),
        );

        // Actualizar precio de compra vigente si difiere
        if (Number(product['purchase_price'] ?? 0) !== Number(item.unitCost)) {
          await qr.manager.update(
            'products',
            { id: item.productId },
            { purchase_price: item.unitCost },
          );
        }

        // Crear movimiento de inventario ENTRADA
        // (la entidad inventory_movements se creará en el módulo Inventory)
        // Se deja el hook aquí para integración futura sin romper la transacción
      }

      purchase.status     = PurchaseStatus.RECEIVED;
      purchase.receivedAt = new Date();

      const saved = await qr.manager.save(SupplierPurchase, purchase);

      // T07: registrar en historial
      await this.registerStatusChange(
        qr, purchase.id, PurchaseStatus.PENDING, PurchaseStatus.RECEIVED, userId,
      );

      await qr.commitTransaction();
      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ── T07: cancelación con historial ─────────────────────────────────────
  private async cancelPurchase(
    purchase: SupplierPurchase,
    userId: string,
  ): Promise<SupplierPurchase> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const fromStatus    = purchase.status;
      purchase.status     = PurchaseStatus.CANCELLED;

      const saved = await qr.manager.save(SupplierPurchase, purchase);

      await this.registerStatusChange(
        qr, purchase.id, fromStatus, PurchaseStatus.CANCELLED, userId,
      );

      await qr.commitTransaction();
      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ── T07: helper registro de historial ──────────────────────────────────
  private async registerStatusChange(
    qr: QueryRunner,
    purchaseId: string,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string,
  ): Promise<void> {
    const entry = qr.manager.create(PurchaseStatusHistory, {
      purchaseId,
      fromStatus,
      toStatus,
      changedBy,
    });
    await qr.manager.save(PurchaseStatusHistory, entry);
  }

  // ── Helper: validar productos ───────────────────────────────────────────
  private async validateProducts(
    qr: QueryRunner,
    productIds: string[],
  ): Promise<void> {
    await Promise.all(
      productIds.map(async (pid) => {
        const product = await qr.manager.findOne('products', {
          where: { id: pid },
        });
        if (!product) throw new NotFoundException(`Producto ${pid} no encontrado`);
      }),
    );
  }
}