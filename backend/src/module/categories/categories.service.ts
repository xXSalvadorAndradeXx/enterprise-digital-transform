import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { PublicCategoryResponseDto } from './dto/public-category-response.dto';

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

  async findAllPublic(): Promise<PublicCategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({ order: { nombre: 'ASC' } });
    return categories.map((cat) => PublicCategoryResponseDto.fromEntity(cat));
  }

  async findOnePublic(id: number): Promise<PublicCategoryResponseDto> {
    const category = await this.findOne(id);
    return PublicCategoryResponseDto.fromEntity(category);
  }
}