  import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { InventoryQueryDto } from '../dto/inventory-query.dto';
import { InventoryDetail } from '../entities/inventory-detail.entity';

@Injectable()
export class InventoryRepository extends Repository<Inventory> {
  constructor(private readonly dataSource: DataSource) {
    super(Inventory, dataSource.createEntityManager());
  }

  async findAllPaginated(query: InventoryQueryDto): Promise<[Inventory[], number]> {
    const qb = this.createQueryBuilder('inventory');

    // RN-I-009: Cargar relaciones e incorporar SupplierPurchase para control de compras eliminadas
    qb.leftJoinAndSelect('inventory.category', 'category')
      .leftJoinAndSelect('inventory.supplier', 'supplier')
      .leftJoin('inventory.purchase', 'purchase');

    // RN-I-006: Subconsulta para calcular totalStock dinámicamente mediante SUM(details.stock)
    qb.addSelect(subQuery => {
      return subQuery
        .select('COALESCE(SUM(d.stock), 0)', 'total_stock')
        .from(InventoryDetail, 'd')
        .where('d.inventory_id = inventory.id');
    }, 'totalStock');

    // RN-I-006: Subconsulta para calcular totalVariants dinámicamente mediante COUNT(details.id)
    qb.addSelect(subQuery => {
      return subQuery
        .select('COUNT(d.id)', 'total_variants')
        .from(InventoryDetail, 'd')
        .where('d.inventory_id = inventory.id');
    }, 'totalVariants');

    // Excluir registros eliminados de inventario aplicando el filtro deleted_at IS NULL
    qb.andWhere('inventory.deletedAt IS NULL');

    // RN-I-009: Excluir inventarios asociados a compras eliminadas (deleted_at IS NOT NULL)
    qb.andWhere('(inventory.purchaseId IS NULL OR purchase.deletedAt IS NULL)');

    // Filtros condicionales
    if (query.supplierId) {
      qb.andWhere('inventory.supplierId = :supplierId', { supplierId: query.supplierId });
    }

    if (query.categoryId) {
      qb.andWhere('inventory.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query.status) {
      qb.andWhere('inventory.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('inventory.productName ILIKE :search', { search: `%${query.search}%` });
    }

    // Ordenamiento dinámico seguro utilizando lista blanca (created_at, product_name, status)
    const sortWhitelist: Record<string, string> = {
      created_at: 'inventory.createdAt',
      product_name: 'inventory.productName',
      status: 'inventory.status',
    };

    const sortBy = query.sortBy && sortWhitelist[query.sortBy] ? query.sortBy : 'created_at';
    const sortColumn = sortWhitelist[sortBy];
    const sortOrder = query.order === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(sortColumn, sortOrder);

    // Paginación mediante skip y take
    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);

    // Obtener total registros sin paginar
    const count = await qb.getCount();

    // Obtener entidades y crudos para mapear campos virtuales calculados
    const { entities, raw } = await qb.getRawAndEntities();

    const mappedEntities = entities.map((entity, index) => {
      const rawItem = raw[index];
      const totalStockVal = rawItem?.totalStock ?? rawItem?.totalstock ?? 0;
      const totalVariantsVal = rawItem?.totalVariants ?? rawItem?.totalvariants ?? 0;

      entity.totalStock = Number(totalStockVal);
      entity.totalVariants = Number(totalVariantsVal);
      return entity;
    });

    return [mappedEntities, count];
  }

  async findOneWithDetails(id: string): Promise<Inventory | null> {
    return this.createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.details', 'details')
      .leftJoinAndSelect('inventory.category', 'category')
      .leftJoinAndSelect('inventory.supplier', 'supplier')
      .leftJoin('inventory.purchase', 'purchase')
      .where('inventory.id = :id', { id })
      .andWhere('inventory.deletedAt IS NULL')
      .andWhere('(inventory.purchaseId IS NULL OR purchase.deletedAt IS NULL)')
      .getOne();
  }
}
