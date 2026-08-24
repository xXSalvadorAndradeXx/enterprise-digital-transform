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
import {
  PublicProductResponseDto,
  PublicProductDetailResponseDto,
} from './dto/public-product-response.dto';
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
      'Obtener detalle público comercial de un producto por ID (Diferencia PRODUCT_NOT_FOUND y PRODUCT_NOT_PUBLISHED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle público comercial del producto obtenido exitosamente',
    type: PublicProductDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'ID de producto no válido (debe ser un UUID) o el producto no está publicado (PRODUCT_NOT_PUBLISHED)',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado (PRODUCT_NOT_FOUND)',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SingleResponse<PublicProductDetailResponseDto>> {
    const product = await this.productsService.findEcommerceProductById(id);
    return { data: product };
  }
}
