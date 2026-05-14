// src/products/products.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../auth/dto/pagination.dto';

// Regex para validar UUID
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  // ==========================
  // GET /products
  // TypeORM excluye soft deleted automáticamente
  // ==========================
  async findAll(paginationDto: PaginationDto) {
    const { limit, offset } = paginationDto;

    const [products, total] = await this.productRepo.findAndCount({
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: products,
      meta: {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1,
        hasNextPage: offset + limit < total,
        hasPrevPage: offset > 0,
      },
    };
  }

  // ==========================
  // GET /products/:id
  // ==========================
  async findOne(id: string) {
    this.validateUUID(id);

    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(
        `Producto con id "${id}" no encontrado`,
      );
    }

    return product;
  }

  // ==========================
  // POST /products
  // ==========================
  async create(dto: CreateProductDto) {
    const category = await this.findCategory(dto.categoryId);

    const product = this.productRepo.create({
      ...dto,
      category,
    });

    return await this.productRepo.save(product);
  }

  // ==========================
  // PATCH /products/:id
  // ==========================
  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (dto.categoryId) {
      product.category = await this.findCategory(dto.categoryId);
    }

    Object.assign(product, dto);

    return await this.productRepo.save(product);
  }

  // ==========================
  // DELETE /products/:id
  // Soft delete
  // ==========================
  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productRepo.softRemove(product);

    return {
      message: `Producto "${id}" eliminado correctamente`,
    };
  }

  // ==========================
  // RESTORE /products/:id/restore
  // Restaurar producto
  // ==========================
  async restore(id: string) {
    this.validateUUID(id);

    const product = await this.productRepo.findOne({
      where: { id },
      withDeleted: true,
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(
        `Producto con id "${id}" no encontrado`,
      );
    }

    await this.productRepo.recover(product);

    return {
      message: `Producto "${id}" restaurado correctamente`,
    };
  }

  // ==========================
  // GET todos incluyendo eliminados
  // (solo admin)
  // ==========================
  async findAllWithDeleted() {
    return this.productRepo.find({
      withDeleted: true,
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  // ==========================
  // Helpers privados
  // ==========================
  private validateUUID(id: string): void {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException(
        `"${id}" no es un UUID válido`,
      );
    }
  }

  private async findCategory(id: string): Promise<Category> {
    this.validateUUID(id);

    const category = await this.categoryRepo.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(
        `Categoría con id "${id}" no encontrada`,
      );
    }

    return category;
  }
}