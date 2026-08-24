import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { PublicCategoryResponseDto } from './dto/public-category-response.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { ProductStatus } from '../products/enums/product-status.enum';
import { InventoryStatus } from '../inventory/enums/inventory-status.enum';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return category;
  }

  async findAllPublic(
    queryDto?: CategoryQueryDto,
  ): Promise<PublicCategoryResponseDto[]> {
    const query = this.categoryRepository
      .createQueryBuilder('c')
      .leftJoin('inventories', 'inv', 'inv.category_id = c.id')
      .leftJoin(
        'products',
        'p',
        'p.inventory_id = inv.id AND p.deleted_at IS NULL AND p.status = :activeStatus AND p.is_published = :isPublished AND inv.status != :outOfStock',
        {
          activeStatus: ProductStatus.ACTIVE,
          isPublished: true,
          outOfStock: InventoryStatus.OUT_OF_STOCK,
        },
      )
      .select('c.id', 'id')
      .addSelect('c.nombre', 'nombre')
      .addSelect('c.descripcion', 'descripcion')
      .addSelect('COUNT(DISTINCT p.id)', 'publishedProductsCount')
      .groupBy('c.id')
      .addGroupBy('c.nombre')
      .addGroupBy('c.descripcion')
      .orderBy('c.nombre', 'ASC');

    if (queryDto?.publishedOnly === true) {
      query.having('COUNT(DISTINCT p.id) > 0');
    }

    const rawResults = await query.getRawMany();

    return rawResults.map((raw) => {
      const dto = new PublicCategoryResponseDto();
      dto.id = Number(raw.id);
      dto.name = raw.nombre;
      dto.slug = PublicCategoryResponseDto.generateSlug(raw.nombre);
      dto.publishedProductsCount = Number(raw.publishedProductsCount ?? 0);
      dto.description = raw.descripcion ?? null;
      return dto;
    });
  }

  async findOnePublic(id: number): Promise<PublicCategoryResponseDto> {
    const query = this.categoryRepository
      .createQueryBuilder('c')
      .leftJoin('inventories', 'inv', 'inv.category_id = c.id')
      .leftJoin(
        'products',
        'p',
        'p.inventory_id = inv.id AND p.deleted_at IS NULL AND p.status = :activeStatus AND p.is_published = :isPublished AND inv.status != :outOfStock',
        {
          activeStatus: ProductStatus.ACTIVE,
          isPublished: true,
          outOfStock: InventoryStatus.OUT_OF_STOCK,
        },
      )
      .select('c.id', 'id')
      .addSelect('c.nombre', 'nombre')
      .addSelect('c.descripcion', 'descripcion')
      .addSelect('COUNT(DISTINCT p.id)', 'publishedProductsCount')
      .where('c.id = :id', { id })
      .groupBy('c.id')
      .addGroupBy('c.nombre')
      .addGroupBy('c.descripcion');

    const raw = await query.getRawOne();

    if (!raw) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    const dto = new PublicCategoryResponseDto();
    dto.id = Number(raw.id);
    dto.name = raw.nombre;
    dto.slug = PublicCategoryResponseDto.generateSlug(raw.nombre);
    dto.publishedProductsCount = Number(raw.publishedProductsCount ?? 0);
    dto.description = raw.descripcion ?? null;
    return dto;
  }
}