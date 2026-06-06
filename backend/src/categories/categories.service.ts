import {
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  // Obtener todas las categorías
  findAll() {
    return this.repo.find({
      order: { name: 'ASC' },
    });
  }

  // Crear categoría
  async create(dto: CreateCategoryDto) {
    const exists = await this.repo.findOne({
      where: {
        name: dto.name,
      },
    });

    if (exists) {
      throw new ConflictException(
        'La categoría ya existe',
      );
    }

    const category = this.repo.create(dto);

    return this.repo.save(category);
  }
}