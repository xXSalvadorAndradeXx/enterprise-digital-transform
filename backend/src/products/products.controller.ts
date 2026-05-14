import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param, // <-- agrega esto
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { CreateProductDto } from '../auth/dto/create-product.dto';
import { PaginationDto } from '../auth/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  @Get(':id') // <-- agrega esto
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}