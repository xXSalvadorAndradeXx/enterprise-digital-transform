import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findAll(filterDto: ProductFilterDto) {
    const { limit = 10, offset = 0, search, minPrice, maxPrice, categoryId, sortBy = 'createdAt', order = SortOrder.DESC } = filterDto;
    
    const query = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (search) {
      query.andWhere(
        '(LOWER(product.nombre) LIKE LOWER(:search) OR LOWER(product.descripcion) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    if (minPrice !== undefined) {
      query.andWhere('product.precio >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere('product.precio <= :maxPrice', { maxPrice });
    }

    if (categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // Apply sorting
    query.orderBy(`product.${sortBy}`, order);

    query.take(limit).skip(offset);

    const [data, total] = await query.getManyAndCount();

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