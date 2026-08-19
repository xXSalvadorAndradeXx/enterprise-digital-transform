import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InventoryDetail } from '../entities/inventory-detail.entity';

@Injectable()
export class InventoryDetailRepository extends Repository<InventoryDetail> {
  constructor(private readonly dataSource: DataSource) {
    super(InventoryDetail, dataSource.createEntityManager());
  }

  async findByInventoryId(inventoryId: string): Promise<InventoryDetail[]> {
    return this.find({
      where: { inventoryId },
      order: { sku: 'ASC' },
    });
  }

  async findLowStock(
    page: number = 1,
    limit: number = 10,
  ): Promise<[InventoryDetail[], number]> {
    const qb = this.createQueryBuilder('detail')
      .leftJoinAndSelect('detail.inventory', 'inventory')
      .where('detail.stock <= detail.minStock')
      .andWhere('detail.minStock > 0');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    return qb.getManyAndCount();
  }
}
