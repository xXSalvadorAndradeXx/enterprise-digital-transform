// src/modules/products/products.service.ts
import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(query: QueryProductDto) {
    const { search, categoryId, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) where.isActive   = isActive;
    if (categoryId)             where.categoryId = categoryId;
    if (search)                 where.name       = ILike(`%${search}%`);

    const [data, total] = await this.productRepo.findAndCount({
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

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { sku } });
    if (!product) throw new NotFoundException(`Producto con SKU ${sku} no encontrado`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productRepo.findOne({ where: { sku: dto.sku } });
    if (existing) throw new ConflictException('Ya existe un producto con ese SKU');

    const product = this.productRepo.create({
      sku:         dto.sku,
      name:        dto.name,
      description: dto.description  ?? null,
      unit:        dto.unit,
      cost:        dto.cost,
      price:       dto.price,
      minStock:    dto.minStock     ?? 0,
      categoryId:  dto.categoryId   ?? null,
    });

    return this.productRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (dto.sku && dto.sku !== product.sku) {
      const dup = await this.productRepo.findOne({ where: { sku: dto.sku } });
      if (dup) throw new ConflictException('Ya existe un producto con ese SKU');
      product.sku = dto.sku;
    }

    Object.assign(product, {
      name:        dto.name        ?? product.name,
      description: dto.description ?? product.description,
      unit:        dto.unit        ?? product.unit,
      cost:        dto.cost        ?? product.cost,
      price:       dto.price       ?? product.price,
      minStock:    dto.minStock    ?? product.minStock,
      categoryId:  dto.categoryId  ?? product.categoryId,
    });

    return this.productRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.productRepo.softDelete(id);
  }
}
