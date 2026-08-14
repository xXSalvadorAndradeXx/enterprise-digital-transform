import { Controller, Get, Post, Patch, Delete, Body, Query, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductFilterDto } from './dto/product-filter.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginatedResponse, SingleResponse } from '../common/interfaces/api-response.interface';
import { Product } from './entities/product.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() filterDto: ProductFilterDto): Promise<PaginatedResponse<Product>> {
    return this.productsService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SingleResponse<Product>> {
    const product = await this.productsService.findOne(id);
    return { data: product };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createProductDto: CreateProductDto): Promise<SingleResponse<Product>> {
    const product = await this.productsService.create(createProductDto);
    return { data: product };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<SingleResponse<Product>> {
    const product = await this.productsService.update(id, updateProductDto);
    return { data: product };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<SingleResponse<Product>> {
    const product = await this.productsService.remove(id);
    return { data: product };
  }
}