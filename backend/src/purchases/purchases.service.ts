// src/modules/purchases/purchases.service.ts
import {
  Injectable, NotFoundException,
  BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { QueryPurchaseDto } from './dto/query-purchase.dto';
import { PurchaseStatus } from './enums/purchase-status.enum';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private readonly itemRepo: Repository<PurchaseItem>,
    private readonly dataSource: DataSource,
    
  ) {}

  async findAll(query: QueryPurchaseDto) {
    const { status, supplierId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.purchaseRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.supplier', 'supplier')
      .leftJoinAndSelect('p.createdBy', 'createdBy')
      .leftJoinAndSelect('p.items', 'items')
      .orderBy('p.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (status)     qb.andWhere('p.status = :status', { status });
    if (supplierId) qb.andWhere('p.supplier_id = :supplierId', { supplierId });

    const [data, total] = await qb.getManyAndCount();

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

  async findOne(id: string): Promise<Purchase> {
    const purchase = await this.purchaseRepo.findOne({ where: { id } });
    if (!purchase) throw new NotFoundException(`Compra ${id} no encontrada`);
    return purchase;
  }

  async create(dto: CreatePurchaseDto, userId: string): Promise<Purchase> {
    return this.dataSource.transaction(async (manager) => {
      const reference = await this.generateReference();

      // Calcular items y total
      const items = dto.items.map((i) => {
        const subtotal = Number(i.quantity) * Number(i.unitCost);
        return manager.create(PurchaseItem, {
          productId: i.productId,
          quantity:  i.quantity,
          unitCost:  i.unitCost,
          subtotal,
        });
      });

      const total = items.reduce((sum, i) => sum + Number(i.subtotal), 0);

      const purchase = manager.create(Purchase, {
        reference,
        supplierId:  dto.supplierId,
        createdById: userId,
        notes:       dto.notes ?? null,
        total,
        items,
      });

      return manager.save(Purchase, purchase);
    });
  }

  async update(id: string, dto: UpdatePurchaseDto): Promise<Purchase> {
    const purchase = await this.findOne(id);

    this.assertEditable(purchase);

    return this.dataSource.transaction(async (manager) => {
      if (dto.notes !== undefined) purchase.notes = dto.notes;

      if (dto.items) {
        // Eliminar items anteriores y reemplazar
        await manager.delete(PurchaseItem, { purchaseId: id });

        purchase.items = dto.items.map((i) => {
          const subtotal = Number(i.quantity) * Number(i.unitCost);
          return manager.create(PurchaseItem, {
            purchaseId: id,
            productId:  i.productId,
            quantity:   i.quantity,
            unitCost:   i.unitCost,
            subtotal,
          });
        });

        purchase.total = purchase.items.reduce(
          (sum, i) => sum + Number(i.subtotal), 0,
        );
      }

      return manager.save(Purchase, purchase);
    });
  }

  async submit(id: string): Promise<Purchase> {
    const purchase = await this.findOne(id);

    if (purchase.status !== PurchaseStatus.DRAFT) {
      throw new BadRequestException('Solo se puede enviar una compra en estado DRAFT');
    }

    purchase.status    = PurchaseStatus.PENDING;
    purchase.orderedAt = new Date();

    return this.purchaseRepo.save(purchase);
  }

  async approve(id: string, userId: string): Promise<Purchase> {
    const purchase = await this.findOne(id);

    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestException('Solo se puede aprobar una compra en estado PENDING');
    }

    if (purchase.createdById === userId) {
      throw new ForbiddenException('No puedes aprobar una compra que tú mismo creaste');
    }

    purchase.status     = PurchaseStatus.APPROVED;
    purchase.approvedAt = new Date();
    purchase.approvedById = userId;

    return this.purchaseRepo.save(purchase);
  }

  async receive(id: string): Promise<Purchase> {
    const purchase = await this.findOne(id);

    if (purchase.status !== PurchaseStatus.APPROVED) {
      throw new BadRequestException('Solo se puede recibir una compra APPROVED');
    }

    // La actualización de inventario va en el módulo Inventory (Paso 11)
    // Aquí solo cambiamos el estado
    purchase.status     = PurchaseStatus.RECEIVED;
    purchase.receivedAt = new Date();

    return this.purchaseRepo.save(purchase);
  }

  async cancel(id: string): Promise<Purchase> {
    const purchase = await this.findOne(id);

    if ([PurchaseStatus.RECEIVED, PurchaseStatus.CANCELLED].includes(purchase.status)) {
      throw new BadRequestException(
        'No se puede cancelar una compra ya recibida o cancelada',
      );
    }

    purchase.status      = PurchaseStatus.CANCELLED;
    purchase.cancelledAt = new Date();

    return this.purchaseRepo.save(purchase);
  }

  async remove(id: string): Promise<void> {
    const purchase = await this.findOne(id);
    this.assertEditable(purchase);
    await this.purchaseRepo.softDelete(id);
  }

  // ── Helpers privados ────────────────────────────────────────────────────

  private assertEditable(purchase: Purchase): void {
    if (purchase.status !== PurchaseStatus.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden editar compras en estado DRAFT',
      );
    }
  }

  private async generateReference(): Promise<string> {
    const year  = new Date().getFullYear();
    const count = await this.purchaseRepo.count();
    const seq   = String(count + 1).padStart(4, '0');
    return `OC-${year}-${seq}`;
  }
}