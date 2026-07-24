// src/modules/suppliers/suppliers.service.ts
import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
  ) {}

  async findAll(query: QuerySupplierDto) {
    const { search, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = ILike(`%${search}%`);

    const [data, total] = await this.supplierRepo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

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

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepo.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException(`Proveedor ${id} no encontrado`);
    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    if (dto.taxId) {
      const existing = await this.supplierRepo.findOne({
        where: { taxId: dto.taxId },
      });
      if (existing) {
        throw new ConflictException('Ya existe un proveedor con ese NIT/tax_id');
      }
    }

    const supplier = this.supplierRepo.create({
      name:        dto.name,
      taxId:       dto.taxId       ?? null,
      email:       dto.email       ?? null,
      phone:       dto.phone       ?? null,
      address:     dto.address     ?? null,
      contactName: dto.contactName ?? null,
      notes:       dto.notes       ?? null,
    });

    return this.supplierRepo.save(supplier);
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);

    if (dto.taxId && dto.taxId !== supplier.taxId) {
      const dup = await this.supplierRepo.findOne({
        where: { taxId: dto.taxId },
      });
      if (dup) throw new ConflictException('Ya existe un proveedor con ese NIT/tax_id');
    }

    Object.assign(supplier, {
      name:        dto.name        ?? supplier.name,
      taxId:       dto.taxId       ?? supplier.taxId,
      email:       dto.email       ?? supplier.email,
      phone:       dto.phone       ?? supplier.phone,
      address:     dto.address     ?? supplier.address,
      contactName: dto.contactName ?? supplier.contactName,
      notes:       dto.notes       ?? supplier.notes,
    });

    return this.supplierRepo.save(supplier);
  }

  async deactivate(id: string): Promise<Supplier> {
    const supplier = await this.findOne(id);
    supplier.isActive = false;
    return this.supplierRepo.save(supplier);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.supplierRepo.softDelete(id);
  }
}