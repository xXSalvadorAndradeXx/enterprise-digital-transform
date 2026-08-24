import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { PublicCategoryResponseDto } from './dto/public-category-response.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { SingleResponse } from '../../common/interfaces/api-response.interface';

@ApiTags('Catálogo E-Commerce')
@Controller('ecommerce/categories')
export class EcommerceCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Obtener catálogo público de categorías para el e-commerce (Filtrado opcional por publishedOnly=true)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías públicas obtenida exitosamente',
    type: [PublicCategoryResponseDto],
  })
  async findAll(
    @Query() queryDto: CategoryQueryDto,
  ): Promise<PublicCategoryResponseDto[]> {
    return this.categoriesService.findAllPublic(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle público de una categoría por ID entero con conteo de productos publicados',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la categoría obtenido exitosamente',
    type: PublicCategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de categoría no válido (debe ser un número entero positivo)',
  })
  @ApiResponse({
    status: 404,
    description: 'Categoría no encontrada',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SingleResponse<PublicCategoryResponseDto>> {
    const category = await this.categoriesService.findOnePublic(id);
    return { data: category };
  }
}
