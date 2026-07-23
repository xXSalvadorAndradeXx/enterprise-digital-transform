import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { SupplierPurchase, PurchaseStatus } from './entities/supplier-purchase.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';

export interface PaginatedSuppliersResult {
  data: SupplierResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(SupplierPurchase)
    private readonly purchaseRepository: Repository<SupplierPurchase>,
  ) {}

  async findAll(queryDto: SupplierQueryDto): Promise<PaginatedSuppliersResult> {
    const { page = 1, limit = 10, search } = queryDto;
    const skip = (page - 1) * limit;

    const query = this.supplierRepository.createQueryBuilder('supplier');

    if (search) {
      query.where(
        '(supplier.name ILIKE :search OR supplier.contactName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('supplier.createdAt', 'DESC');
    query.take(limit).skip(skip);

    const [suppliers, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 0;

    return {
      data: suppliers.map((supplier) => SupplierResponseDto.fromEntity(supplier)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<SupplierResponseDto> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Proveedor con id ${id} no encontrado`);
    }
    return SupplierResponseDto.fromEntity(supplier);
  }

  async create(createSupplierDto: CreateSupplierDto): Promise<SupplierResponseDto> {
    const existing = await this.supplierRepository.createQueryBuilder('supplier')
      .where('LOWER(supplier.name) = LOWER(:name)', { name: createSupplierDto.name })
      .getOne();

    if (existing) {
      throw new ConflictException(`Ya existe un proveedor con el nombre "${createSupplierDto.name}"`);
    }

    const supplier = this.supplierRepository.create(createSupplierDto);
    const saved = await this.supplierRepository.save(supplier);
    return SupplierResponseDto.fromEntity(saved);
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Proveedor con id ${id} no encontrado`);
    }

    if (updateSupplierDto.name && updateSupplierDto.name.toLowerCase() !== supplier.name.toLowerCase()) {
      const duplicate = await this.supplierRepository.createQueryBuilder('supplier')
        .where('LOWER(supplier.name) = LOWER(:name)', { name: updateSupplierDto.name })
        .andWhere('supplier.id != :id', { id })
        .getOne();

      if (duplicate) {
        throw new ConflictException(`Ya existe otro proveedor con el nombre "${updateSupplierDto.name}"`);
      }
    }

    this.supplierRepository.merge(supplier, updateSupplierDto);
    const updated = await this.supplierRepository.save(supplier);
    return SupplierResponseDto.fromEntity(updated);
  }

  async hasActivePurchases(supplierId: string): Promise<boolean> {
    const activeCount = await this.purchaseRepository.count({
      where: {
        supplierId,
        status: In([PurchaseStatus.PENDING, PurchaseStatus.RECEIVED]),
      },
    });
    return activeCount > 0;
  }

  async remove(id: string): Promise<SupplierResponseDto> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Proveedor con id ${id} no encontrado`);
    }

    const activePurchases = await this.hasActivePurchases(id);
    if (activePurchases) {
      throw new ConflictException(
        'No se puede eliminar el proveedor porque tiene compras activas en estado Pendiente o Recibida',
      );
    }

    const softRemoved = await this.supplierRepository.softRemove(supplier);
    return SupplierResponseDto.fromEntity(softRemoved);
  }
}
