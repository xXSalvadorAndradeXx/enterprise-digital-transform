import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { PublicCategoryResponseDto } from './dto/public-category-response.dto';
import { SingleResponse } from '../../common/interfaces/api-response.interface';

@ApiTags('Catálogo E-Commerce')
@Controller('ecommerce/categories')
export class EcommerceCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener catálogo público de categorías para el e-commerce',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías públicas obtenida exitosamente',
    type: [PublicCategoryResponseDto],
  })
  async findAll(): Promise<PublicCategoryResponseDto[]> {
    return this.categoriesService.findAllPublic();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle público de una categoría por ID entero',
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
