import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerFavoritesService } from '../customer-favorites.service';
import { CustomerJwtAuthGuard } from '../guards/customer-jwt-auth.guard';
import { AddFavoriteDto } from '../dto/add-favorite.dto';

@ApiTags('Customer Favorites')
@ApiBearerAuth()
@UseGuards(CustomerJwtAuthGuard)
@Controller('customers/me/favorites')
export class CustomerFavoritesController {
  constructor(
    private readonly customerFavoritesService: CustomerFavoritesService,
  ) {}

  @ApiOperation({
    summary: 'Obtener el listado de productos favoritos del cliente autenticado',
  })
  @Get()
  async getMyFavorites(@Req() req: any) {
    const items = await this.customerFavoritesService.findAll(req.user.id);
    return {
      success: true,
      data: items,
    };
  }

  @ApiOperation({
    summary: 'Agregar un producto a los favoritos del cliente autenticado',
  })
  @ApiBody({ type: AddFavoriteDto })
  @Post()
  async addFavorite(@Req() req: any, @Body() dto: AddFavoriteDto) {
    const result = await this.customerFavoritesService.add(
      req.user.id,
      dto.productId,
    );
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({
    summary: 'Verificar si un producto está en los favoritos del cliente autenticado',
  })
  @Get('check/:productId')
  async checkIsFavorite(
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
    const isFav = await this.customerFavoritesService.isFavorite(
      req.user.id,
      productId,
    );
    return {
      success: true,
      isFavorite: isFav,
    };
  }

  @ApiOperation({
    summary: 'Eliminar un producto específico de los favoritos del cliente autenticado',
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
    summary: 'Vaciar completamente la lista de favoritos del cliente autenticado',
  })
  @Delete()
  async clearAllFavorites(@Req() req: any) {
    const result = await this.customerFavoritesService.clearAll(req.user.id);
    return {
      success: true,
      message: result.message,
    };
  }
}
