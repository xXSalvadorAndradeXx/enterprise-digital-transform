// src/modules/product-categories/dto/update-product-category.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProductCategoryDto } from './create-product-category.dto';

export class UpdateProductCategoryDto extends PartialType(CreateProductCategoryDto) {}