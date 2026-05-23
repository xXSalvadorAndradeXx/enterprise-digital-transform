// src/products/products.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';

import { ProductsService } from './products.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  // ==========================
  // GET /products
  // Público
  // Ej:
  // /products?search=laptop&minPrice=100&maxPrice=500&page=1&limit=10
  // ==========================
  @Get()
  findAll(
    @Query() filters: FilterProductDto,
  ) {
    return this.productsService.findAll(filters);
  }

  // ==========================
  // GET /products/:id
  // Público
  // ==========================
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.findOne(id);
  }

  // ==========================
  // POST /products
  // Solo admin
  // ==========================
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(dto);
  }

  // ==========================
  // PATCH /products/:id
  // Solo admin
  // ==========================
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  // ==========================
  // DELETE /products/:id
  // Solo admin
  // ==========================
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.remove(id);
  }

  // ==========================
  // PATCH /products/:id/restore
  // Solo admin
  // ==========================
  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  restore(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.restore(id);
  }
}