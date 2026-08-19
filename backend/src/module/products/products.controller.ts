import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductFilterDto } from './dto/product-filter.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SingleResponse } from '../../common/interfaces/api-response.interface';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener catálogo público de productos publicados con filtros y paginación',
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de productos obtenido exitosamente',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta no válidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
  })
  async findAll(
    @Query() filterDto: ProductFilterDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productsService.findPublished(filterDto);
  }

  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:read')
  @ApiOperation({ summary: 'Obtener productos para administración, incluyendo borradores' })
  async findAllForAdmin(
    @Query() filterDto: ProductFilterDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productsService.findAll(filterDto);
  }

  @Post('upload-image')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // Máximo 5 MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimetypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedMimetypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Formato de archivo no permitido. Solo se permiten imágenes PNG y JPEG',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagen PNG o JPEG (máx. 5 MB)',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Cargar imagen de producto (PNG/JPEG máx 5 MB)',
  })
  @ApiResponse({
    status: 201,
    description: 'Imagen cargada exitosamente',
    type: UploadImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo o formato no válido, o supera los 5 MB',
  })
  @ApiResponse({
    status: 422,
    description: 'Error al procesar la entidad',
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    return this.productsService.uploadProductImage(file);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:create')
  @ApiOperation({
    summary: 'Crear un nuevo producto',
  })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada no válidos',
  })
  @ApiResponse({
    status: 404,
    description: 'El inventario o la variante especificada no existe',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflicto de negocio (ej. inventario sin stock o ya asociado a otro producto activo)',
  })
  @ApiResponse({
    status: 422,
    description:
      'Entidad no procesable (ej. descuento sin fecha fin o > 10 imágenes)',
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any,
  ): Promise<SingleResponse<ProductResponseDto>> {
    const product = await this.productsService.create(createProductDto, user);
    return { data: product };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un producto publicado por ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del producto obtenido exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'ID de producto no válido (debe ser un UUID)',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado o eliminado lógicamente',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SingleResponse<ProductResponseDto>> {
    const product = await this.productsService.findOnePublished(id);
    return { data: product };
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiOperation({
    summary: 'Actualizar estado del producto mediante máquina de estados',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del producto actualizado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada o ID no válidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  @ApiResponse({
    status: 409,
    description:
      'Transición de estado no permitida o inventario sin stock disponible',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
    @CurrentUser() user: any,
  ): Promise<SingleResponse<ProductResponseDto>> {
    const product = await this.productsService.updateStatus(
      id,
      updateStatusDto,
      user,
    );
    return { data: product };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  @ApiOperation({
    summary: 'Actualizar parcialmente un producto existente',
  })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada o ID no válidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Un producto discontinuado no puede ser modificado',
  })
  @ApiResponse({
    status: 422,
    description:
      'No se permite modificar inventoryId o validaciones de descuento/imágenes fallidas',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
  ): Promise<SingleResponse<ProductResponseDto>> {
    const product = await this.productsService.update(
      id,
      updateProductDto,
      user,
    );
    return { data: product };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('products:delete')
  @ApiOperation({
    summary: 'Eliminar lógicamente un producto (Soft Delete)',
  })
  @ApiResponse({
    status: 204,
    description: 'Producto eliminado lógicamente (sin contenido)',
  })
  @ApiResponse({
    status: 400,
    description: 'ID de producto no válido (debe ser un UUID)',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.productsService.remove(id, user);
  }
}
