// src/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from '../auth/dto/create-product.dto'; // ← ruta correcta

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private repo: Repository<Product>,
  ) {}

  findAll() {
    return this.repo.find({
      where: { isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const product = await this.repo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  // ← esto faltaba
  async create(dto: CreateProductDto) {
    const product = this.repo.create({
      ...dto,
      category: { id: dto.categoryId }, // TypeORM resuelve la relación por ID
    });
    return this.repo.save(product);
  }
}