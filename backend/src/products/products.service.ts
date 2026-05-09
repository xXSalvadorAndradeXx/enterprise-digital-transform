import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private repo: Repository<Product>,
  ) {}

  // Devuelve TODOS los productos activos con su categoría
  findAll() {
    return this.repo.find({
      where: { isActive: true },
      relations: ['category'],       // ← join con la tabla categories
      order: { createdAt: 'DESC' },  // ← los más nuevos primero
    });
  }

  // Devuelve un producto por ID (útil para GET /products/:id)
  async findOne(id: string) {
    const product = await this.repo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }
}