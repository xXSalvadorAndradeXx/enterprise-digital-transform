import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { data, total } = await this.productsService.findAll(paginationDto);
    
    return {
      status: 'success',
      message: 'Productos obtenidos',
      data: {
        products: data,
        total,
      },
    };
  }
}