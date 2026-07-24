// src/modules/product-categories/product-categories.service.ts
import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoryRepo: Repository<ProductCategory>,
  ) {}

  async findAll(): Promise<ProductCategory[]> {
    return this.categoryRepo.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProductCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Categoría ${id} no encontrada`);
    return category;
  }

  async create(dto: CreateProductCategoryDto): Promise<ProductCategory> {
    const existing = await this.categoryRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Ya existe una categoría con ese nombre');

    const category = this.categoryRepo.create({
      name:        dto.name,
      description: dto.description ?? null,
    });

    return this.categoryRepo.save(category);
  }

  async update(id: string, dto: UpdateProductCategoryDto): Promise<ProductCategory> {
    const category = await this.findOne(id);

    if (dto.name && dto.name !== category.name) {
      const dup = await this.categoryRepo.findOne({ where: { name: dto.name } });
      if (dup) throw new ConflictException('Ya existe una categoría con ese nombre');
      category.name = dto.name;
    }

    if (dto.description !== undefined) category.description = dto.description ?? null;

    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.categoryRepo.softDelete(id);
  }
}