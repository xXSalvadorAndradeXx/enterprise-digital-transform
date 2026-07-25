// src/modules/inventory/inventory.service.ts
import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { QueryMovementsDto } from './dto/query-inventory.dto';
import { MovementType } from './enums/movement-type.enum';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Stock actual ────────────────────────────────────────────────────────

  async findAll() {
    return this.inventoryRepo.find({ order: { productId: 'ASC' } });
  }

  async findByProduct(productId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepo.findOne({ where: { productId } });
    if (!inventory) throw new NotFoundException(`Inventario para producto ${productId} no encontrado`);
    return inventory;
  }

  // ── Movimientos ─────────────────────────────────────────────────────────

  async findMovements(query: QueryMovementsDto) {
    const { productId, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.movementRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.product', 'product')
      .leftJoinAndSelect('m.createdBy', 'createdBy')
      .orderBy('m.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (productId) qb.andWhere('m.product_id = :productId', { productId });
    if (type)      qb.andWhere('m.type = :type', { type });

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

  // ── Ajuste manual ───────────────────────────────────────────────────────

  async adjust(dto: AdjustStockDto, userId: string): Promise<InventoryMovement> {
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
      const stockAfter  = stockBefore + Number(dto.quantity);

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
        productId:   dto.productId,
        type:        dto.type,
        quantity:    dto.quantity,
        stockBefore,
        stockAfter,
        notes:       dto.notes       ?? null,
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
            stock:     0,
            reserved:  0,
          });
        }

        const stockBefore = Number(inventory.stock);
        const stockAfter  = stockBefore + Number(item.quantity);

        inventory.stock = stockAfter;
        await manager.save(Inventory, inventory);

        const movement = manager.create(InventoryMovement, {
          productId:   item.productId,
          type:        MovementType.PURCHASE,
          quantity:    item.quantity,
          stockBefore,
          stockAfter,
          notes:       'Recepción de orden de compra',
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

    const inventory = this.inventoryRepo.create({ productId, stock: 0, reserved: 0 });
    return this.inventoryRepo.save(inventory);
  }
}
