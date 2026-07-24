// src/modules/product-categories/product-categories.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductCategoriesService } from './product-categories.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Product Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly categoriesService: ProductCategoriesService) {}

  @Get()
  @RequirePermissions('product-categories:read')
  @ApiOperation({ summary: 'Lista todas las categorías' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('product-categories:read')
  @ApiOperation({ summary: 'Detalle de una categoría' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @RequirePermissions('product-categories:create')
  @ApiOperation({ summary: 'Crear categoría' })
  create(@Body() dto: CreateProductCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('product-categories:update')
  @ApiOperation({ summary: 'Actualizar categoría' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('product-categories:delete')
  @ApiOperation({ summary: 'Soft delete de categoría' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
