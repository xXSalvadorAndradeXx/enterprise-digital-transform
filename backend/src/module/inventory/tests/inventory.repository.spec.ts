import { DataSource } from 'typeorm';
import { InventoryRepository } from '../repositories/inventory.repository';
import { InventoryDetailRepository } from '../repositories/inventory-detail.repository';
import { InventoryStatus } from '../enums/inventory-status.enum';

describe('Inventory Repository Specs', () => {
  let mockQueryBuilder: any;
  let mockEntityManager: any;
  let mockDataSource: any;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      getRawAndEntities: jest.fn().mockResolvedValue({
        entities: [{ id: 'inv-1', productName: 'Producto Test' }],
        raw: [
          { totalStock: '20', totalVariants: '2', totalInventoryCost: '475.5' },
        ],
      }),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([[{ id: 'detail-1', stock: 2, minStock: 10 }], 1]),
      getOne: jest
        .fn()
        .mockResolvedValue({ id: 'inv-1', productName: 'Producto Test' }),
    };

    mockEntityManager = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      find: jest.fn().mockResolvedValue([{ id: 'detail-1', sku: 'SKU-001' }]),
    };

    mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue(mockEntityManager),
    };
  });

  describe('InventoryRepository', () => {
    let repository: InventoryRepository;

    beforeEach(() => {
      repository = new InventoryRepository(mockDataSource as DataSource);
      // Re-enlazar createQueryBuilder en la instancia del repositorio
      repository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
    });

    describe('findAllPaginated', () => {
      it('debe construir correctamente el QueryBuilder y configurar los joins requeridos (category, supplier, purchase)', async () => {
        const query = { page: 1, limit: 10 };
        const [entities, count] = await repository.findAllPaginated(query);

        expect(repository.createQueryBuilder).toHaveBeenCalledWith('inventory');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
          'inventory.category',
          'category',
        );
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
          'inventory.supplier',
          'supplier',
        );
        expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
          'inventory.purchase',
          'purchase',
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'inventory.deletedAt IS NULL',
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          '(inventory.purchaseId IS NULL OR purchase.deletedAt IS NULL)',
        );
        expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
        expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        expect(count).toBe(1);
        expect(entities[0].totalStock).toBe(20);
        expect(entities[0].totalVariants).toBe(2);
        expect(entities[0].totalInventoryCost).toBe(475.5);
      });

      it('debe aplicar ILIKE sobre productName cuando search esté definido', async () => {
        const query = { search: 'zapato' };
        await repository.findAllPaginated(query);

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'inventory.productName ILIKE :search',
          { search: '%zapato%' },
        );
      });

      it('debe aplicar filtros condicionales cuando se proporcionen supplierId, categoryId y status', async () => {
        const query = {
          supplierId: 'sup-1',
          categoryId: 5,
          status: InventoryStatus.ACTIVE,
        };
        await repository.findAllPaginated(query);

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'inventory.supplierId = :supplierId',
          { supplierId: 'sup-1' },
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'inventory.categoryId = :categoryId',
          { categoryId: 5 },
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'inventory.status = :status',
          { status: InventoryStatus.ACTIVE },
        );
      });
    });

    describe('findOneWithDetails', () => {
      it('debe consultar un inventario con joins y filtros de soft-delete', async () => {
        const result = await repository.findOneWithDetails('inv-1');

        expect(repository.createQueryBuilder).toHaveBeenCalledWith('inventory');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
          'inventory.details',
          'details',
        );
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
          'inventory.category',
          'category',
        );
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
          'inventory.supplier',
          'supplier',
        );
        expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
          'inventory.purchase',
          'purchase',
        );
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'inventory.id = :id',
          { id: 'inv-1' },
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'inventory.deletedAt IS NULL',
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          '(inventory.purchaseId IS NULL OR purchase.deletedAt IS NULL)',
        );
        expect(result).toBeDefined();
        expect(result!.id).toBe('inv-1');
      });
    });
  });

  describe('InventoryDetailRepository', () => {
    let detailRepository: InventoryDetailRepository;

    beforeEach(() => {
      detailRepository = new InventoryDetailRepository(
        mockDataSource as DataSource,
      );
      detailRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
      detailRepository.find = jest
        .fn()
        .mockResolvedValue([{ id: 'detail-1', sku: 'SKU-001' }]);
    });

    describe('findLowStock', () => {
      it('debe aplicar correctamente los filtros stock <= minStock y minStock > 0 e incluir la relación con inventory', async () => {
        const [details, total] = await detailRepository.findLowStock(1, 10);

        expect(detailRepository.createQueryBuilder).toHaveBeenCalledWith(
          'detail',
        );
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
          'detail.inventory',
          'inventory',
        );
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'detail.stock <= detail.minStock',
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'detail.minStock > 0',
        );
        expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
        expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
        expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
        expect(total).toBe(1);
        expect(details).toHaveLength(1);
      });
    });

    describe('findByInventoryId', () => {
      it('debe consultar variantes por inventoryId ordenadas por SKU ASC', async () => {
        const result = await detailRepository.findByInventoryId('inv-1');

        expect(detailRepository.find).toHaveBeenCalledWith({
          where: { inventoryId: 'inv-1' },
          order: { sku: 'ASC' },
        });
        expect(result).toHaveLength(1);
      });
    });
  });
});
