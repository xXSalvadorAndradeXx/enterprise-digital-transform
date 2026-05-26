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
import { FilterProductDto } from './dto/filter-product.dto';

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
  // filtros + búsqueda + orden + paginación
  // ==========================
  async findAll(filters: FilterProductDto) {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'DESC',
      page = 1,
      limit = 10,
    } = filters;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :active', {
        active: true,
      });

    if (search) {
      qb.andWhere(
        `(product.name ILIKE :search
          OR product.description ILIKE :search)`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (categoryId) {
      this.validateUUID(categoryId);

      qb.andWhere(
        'category.id = :categoryId',
        { categoryId },
      );
    }

    if (minPrice !== undefined) {
      qb.andWhere(
        'product.price >= :minPrice',
        { minPrice },
      );
    }

    if (maxPrice !== undefined) {
      qb.andWhere(
        'product.price <= :maxPrice',
        { maxPrice },
      );
    }

    // evita SQL injection
    const allowedSort: Record<
      string,
      string
    > = {
      name: 'product.name',
      price: 'product.price',
      createdAt:
        'product.createdAt',
    };

    qb.orderBy(
      allowedSort[sortBy] ??
        'product.createdAt',
      order,
    );

    const skip =
      (page - 1) * limit;

    qb.skip(skip).take(limit);

    const [data, total] =
      await qb.getManyAndCount();

    return {
  data,
  total,
  page,
  limit,
};


  }

  // ==========================
  // GET /products/:id
  // ==========================
  async findOne(id: string) {
    this.validateUUID(id);

    const product =
      await this.productRepo.findOne({
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
  async create(
    dto: CreateProductDto,
  ) {
    const category =
      await this.findCategory(
        dto.categoryId,
      );

    const product =
      this.productRepo.create({
        ...dto,
        category,
      });

    return await this.productRepo.save(
      product,
    );
  }

  // ==========================
  // PATCH /products/:id
  // ==========================
  async update(
    id: string,
    dto: UpdateProductDto,
  ) {
    const product =
      await this.findOne(id);

    if (dto.categoryId) {
      product.category =
        await this.findCategory(
          dto.categoryId,
        );
    }

    Object.assign(product, dto);

    return await this.productRepo.save(
      product,
    );
  }

  // ==========================
  // DELETE /products/:id
  // soft delete
  // ==========================
  async remove(id: string) {
    const product =
      await this.findOne(id);

    await this.productRepo.softRemove(
      product,
    );

    return {
      message:
        `Producto "${id}" eliminado correctamente`,
    };
  }

  // ==========================
  // PATCH /products/:id/restore
  // ==========================
  async restore(id: string) {
    this.validateUUID(id);

    const product =
      await this.productRepo.findOne({
        where: { id },
        withDeleted: true,
        relations: ['category'],
      });

    if (!product) {
      throw new NotFoundException(
        `Producto con id "${id}" no encontrado`,
      );
    }

    await this.productRepo.recover(
      product,
    );

    return {
      message:
        `Producto "${id}" restaurado correctamente`,
    };
  }

  // ==========================
  // GET incluyendo eliminados
  // ==========================
  async findAllWithDeleted() {
    return this.productRepo.find({
      withDeleted: true,
      relations: ['category'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // ==========================
  // Helpers
  // ==========================
  private validateUUID(
    id: string,
  ): void {
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException(
        `"${id}" no es un UUID válido`,
      );
    }
  }

  private async findCategory(
    id: string,
  ): Promise<Category> {
    this.validateUUID(id);

    const category =
      await this.categoryRepo.findOne({
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