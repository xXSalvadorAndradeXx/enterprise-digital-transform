import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from '../auth/dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  findAll() {
    return this.productRepo.find();
  }

  async create(dto: CreateProductDto) {
    // Verificar que la categoría existe
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId }
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    const product = this.productRepo.create({ ...dto, category });
    return this.productRepo.save(product);
  }
}