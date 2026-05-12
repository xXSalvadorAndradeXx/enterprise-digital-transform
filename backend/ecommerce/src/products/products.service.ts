import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    
    const [data, total] = await this.productRepository.findAndCount({
      relations: ['category'],
      take: limit,
      skip: offset,
    });

    return { data, total };
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      // Usamos el exception filter de NestJS para devolver automáticamente un 404 Not Found
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return product;
  }
}