// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { CreateProductDto } from '../auth/dto/create-product.dto';
import { PaginationDto } from '../auth/dto/pagination.dto';

// Regex para validar UUID
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private repo: Repository<Product>,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { limit, offset } = paginationDto;

    const [products, total] = await this.repo.findAndCount({
      where: { isActive: true },
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

  async findOne(id: string) {
    // Validar formato UUID antes de buscar
    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException(`"${id}" no es un ID válido`);
    }

    const product = await this.repo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Producto ${id} no encontrado`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const product = this.repo.create({
      ...dto,
      category: { id: dto.categoryId },
    });

    return this.repo.save(product);
  }
}