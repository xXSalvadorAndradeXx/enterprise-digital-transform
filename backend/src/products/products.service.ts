import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';
import { Repository, DeepPartial } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductFilterDto, SortOrder } from './dto/product-filter.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(filterDto: ProductFilterDto): Promise<PaginatedResponse<Product>> {
    const { limit = 10, page = 1, search, minPrice, maxPrice, sortBy = 'createdAt', order = SortOrder.DESC } = filterDto;
    
    const skip = (page - 1) * limit;

    const query = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.tags', 'tags')
      .leftJoinAndSelect('product.variantConfigs', 'variantConfigs');

    if (search) {
      const fromChars = 'áéíóúäëïöüàèìòù';
      const toChars = 'aeiouaeiouaeiou';
      query.andWhere(
        `(translate(LOWER(product.commercialName), :fromChars, :toChars) LIKE translate(LOWER(:search), :fromChars, :toChars) OR 
          translate(LOWER(product.description), :fromChars, :toChars) LIKE translate(LOWER(:search), :fromChars, :toChars))`,
        { search: `%${search}%`, fromChars, toChars }
      );
    }

    if (minPrice !== undefined) {
      query.andWhere('product.salePrice >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere('product.salePrice <= :maxPrice', { maxPrice });
    }

    // Apply sorting
    query.orderBy(`product.${sortBy}`, order);

    query.take(limit).skip(skip);

    const [data, total] = await query.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images', 'tags', 'variantConfigs', 'inventory'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto as DeepPartial<Product>);
    return (await this.productRepository.save(product)) as Product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    this.productRepository.merge(product, updateProductDto as DeepPartial<Product>);
    return (await this.productRepository.save(product)) as Product;
  }

  async remove(id: string): Promise<Product> {
    const product = await this.findOne(id);
    await this.productRepository.softRemove(product);
    return product;
  }
}