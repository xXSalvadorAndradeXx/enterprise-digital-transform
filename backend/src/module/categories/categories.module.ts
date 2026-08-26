import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesService } from './categories.service'; 
import { CategoriesController } from './categories.controller'; 
import { EcommerceCategoriesController } from './ecommerce-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController, EcommerceCategoriesController], 
  providers: [CategoriesService],
  exports: [TypeOrmModule, CategoriesService]
})
export class CategoriesModule {}