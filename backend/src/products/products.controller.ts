import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()                        // GET /api/products
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')                   // GET /api/products/:id
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
