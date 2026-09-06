import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CustomerFavoritesService } from '../customer-favorites.service';
import { CustomerJwtAuthGuard } from '../guards/customer-jwt-auth.guard';
import { CreateFavoriteDto } from '../dto/create-favorite.dto';
import { FavoritesQueryDto } from '../dto/favorites-query.dto';
import {
  FavoriteResponseDto,
  PaginatedFavoritesResponseDto,
} from '../dto/favorite-response.dto';
import { FavoriteStatusResponseDto } from '../dto/favorite-status-response.dto';

@ApiTags('Customer Favorites')
@ApiBearerAuth()
@UseGuards(CustomerJwtAuthGuard)
@Controller('customers/me/favorites')
export class CustomerFavoritesController {
  constructor(
    private readonly customerFavoritesService: CustomerFavoritesService,
  ) {}

  @ApiOperation({
    summary: 'GET /api/v1/customers/me/favorites — Obtener la lista paginada de favoritos del cliente autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de favoritos con resúmenes de producto para la grilla del e-commerce',
    type: PaginatedFavoritesResponseDto,
  })
  @Get()
  async getMyFavorites(
    @Req() req: any,
    @Query() query: FavoritesQueryDto,
  ) {
    const result = await this.customerFavoritesService.findAll(
      req.user.id,
      query,
    );
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'POST /api/v1/customers/me/favorites — Agregar un producto a la lista de favoritos',
  })
  @ApiBody({ type: CreateFavoriteDto })
  @ApiResponse({
    status: 201,
    description: 'Producto agregado a favoritos correctamente',
    type: FavoriteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'El producto especificado no existe o está eliminado (PRODUCT_NOT_FOUND)',
  })
  @ApiResponse({
    status: 409,
    description: 'El producto ya existe en la lista de favoritos (FAVORITE_ALREADY_EXISTS)',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addFavorite(@Req() req: any, @Body() dto: CreateFavoriteDto) {
    const favorite = await this.customerFavoritesService.add(
      req.user.id,
      dto.productId,
    );
    return {
      success: true,
      data: favorite,
    };
  }

  @ApiOperation({
    summary: 'GET /api/v1/customers/me/favorites/:productId/status — Estado de favorito de un producto (botón de corazón global)',
  })
  @ApiParam({
    name: 'productId',
    description: 'UUID v4 del producto a verificar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de favorito del producto',
    type: FavoriteStatusResponseDto,
  })
  @Get(':productId/status')
  async checkIsFavoriteStatus(
    @Req() req: any,
    @Param(
      'productId',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () =>
          new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'El ID del producto debe ser un UUID versión 4 válido',
          }),
      }),
    )
    productId: string,
  ) {
    const status = await this.customerFavoritesService.isFavorite(
      req.user.id,
      productId,
    );
    return {
      success: true,
      data: status,
    };
  }

  @ApiOperation({
    summary: 'GET /api/v1/customers/me/favorites/check/:productId — Alias de verificación del estado de favorito',
  })
  @Get('check/:productId')
  async checkIsFavoriteAlias(
    @Req() req: any,
    @Param(
      'productId',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () =>
          new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'El ID del producto debe ser un UUID versión 4 válido',
          }),
      }),
    )
    productId: string,
  ) {
    const status = await this.customerFavoritesService.isFavorite(
      req.user.id,
      productId,
    );
    return {
      success: true,
      data: status,
    };
  }

  @ApiOperation({
    summary: 'DELETE /api/v1/customers/me/favorites/:productId — Eliminar un producto de los favoritos',
  })
  @ApiParam({
    name: 'productId',
    description: 'UUID v4 del producto a eliminar de favoritos',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto eliminado de favoritos correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'El producto no existe en los favoritos del cliente (FAVORITE_NOT_FOUND)',
  })
  @Delete(':productId')
  async removeFavorite(
    @Req() req: any,
    @Param(
      'productId',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () =>
          new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'El ID del producto debe ser un UUID versión 4 válido',
          }),
      }),
    )
    productId: string,
  ) {
    const result = await this.customerFavoritesService.remove(
      req.user.id,
      productId,
    );
    return {
      success: true,
      message: result.message,
    };
  }

  @ApiOperation({
    summary: 'DELETE /api/v1/customers/me/favorites — Vaciar completamente la lista de favoritos',
  })
  @ApiResponse({
    status: 200,
    description: 'Todos los favoritos han sido eliminados correctamente',
  })
  @Delete()
  async clearAllFavorites(@Req() req: any) {
    const result = await this.customerFavoritesService.clearAll(req.user.id);
    return {
      success: true,
      message: result.message,
      data: {
        deletedCount: result.deletedCount,
      },
    };
  }
}
