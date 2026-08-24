import {
  Controller,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { PublicProductFilterDto } from './dto/public-product-filter.dto';
import { PublicProductResponseDto } from './dto/public-product-response.dto';
import { SingleResponse } from '../../common/interfaces/api-response.interface';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@ApiTags('Catálogo E-Commerce')
@Controller('ecommerce/products')
export class EcommerceProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Obtener catálogo público de productos para e-commerce v1.2 (Filtros por búsqueda, categoría, marca, género, talla, precios efectivos, disponibilidad y descuentos vigentes)',
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de productos públicos filtrado y paginado exitosamente',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Parámetros de consulta no válidos (ej. availability=OUT_OF_STOCK, gender no permitido, o limit > 100)',
  })
  async findAll(
    @Query() filterDto: PublicProductFilterDto,
  ): Promise<PaginatedResponseDto<PublicProductResponseDto>> {
    return this.productsService.findEcommerceProducts(filterDto);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Obtener detalle público de un producto por ID para el e-commerce (Precios como string decimal)',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del producto público obtenido exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'ID de producto no válido (debe ser un UUID)',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado o no disponible en catálogo público',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SingleResponse<PublicProductResponseDto>> {
    const product = await this.productsService.findEcommerceProductById(id);
    return { data: product };
  }
}
