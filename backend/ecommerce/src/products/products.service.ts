import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  async create(createProductDto: CreateProductDto) {
    const { categoryId, ...productData } = createProductDto;
    
    const product = this.productRepository.create({
      ...productData,
      category: { id: categoryId },
    });

    return await this.productRepository.save(product);
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    const { categoryId, ...productData } = updateProductDto;

    const updateData: any = { ...productData };
    if (categoryId) {
      updateData.category = { id: categoryId };
    }

    this.productRepository.merge(product, updateData);
    return await this.productRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    await this.productRepository.softRemove(product);
    return product;
  }
}