import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  ParseUUIDPipe,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { OptionalCustomerJwtAuthGuard } from '../customers/guards/optional-customer-jwt-auth.guard';
import { CustomerJwtAuthGuard } from '../customers/guards/customer-jwt-auth.guard';

@ApiTags('Carrito de Compras')
@ApiHeader({
  name: 'X-Cart-Token',
  description: 'Token de visitante para carritos de invitado. Se establece automáticamente en el primer POST si no está autenticado.',
  required: false,
})
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(OptionalCustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el carrito activo del usuario autenticado o del visitante (X-Cart-Token)' })
  @ApiResponse({ status: 200, description: 'Carrito obtenido exitosamente', type: CartResponseDto })
  @ApiResponse({ status: 400, description: 'Token del carrito no válido (si visitante sin token) ' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado (si autenticado sin carrito)' })
  async getCart(
    @Req() req: Request,
    @Headers('x-cart-token') xCartToken: string,
  ): Promise<CartResponseDto> {
    const userId = (req as any).user?.userId || (req as any).user?.id || null;
    const { cart } = await this.cartService.resolveCart(userId, xCartToken, Boolean(userId));
    return CartResponseDto.fromEntity(cart);
  }

  @Post('items')
  @UseGuards(OptionalCustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Agregar un ítem al carrito (crea el carrito si no existe). Si es visitante, devuelve X-Cart-Token en header.',
  })
  @ApiResponse({ status: 201, description: 'Ítem agregado exitosamente', type: CartResponseDto })
  @ApiResponse({ status: 400, description: 'Producto no disponible, variante no encontrada o stock insuficiente' })
  async addItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-cart-token') xCartToken: string,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    const userId = (req as any).user?.userId || (req as any).user?.id || null;
    const { cart, createdGuestToken } = await this.cartService.resolveCart(userId, xCartToken, true);

    if (createdGuestToken) {
      res.setHeader('X-Cart-Token', createdGuestToken);
    }

    return this.cartService.addItemToCart(cart.id, dto);
  }

  @Patch('items/:itemId')
  @UseGuards(OptionalCustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar la cantidad de un ítem existente en el carrito' })
  @ApiResponse({ status: 200, description: 'Cantidad actualizada exitosamente', type: CartResponseDto })
  @ApiResponse({ status: 400, description: 'Carrito inactivo o cantidad inválida' })
  @ApiResponse({ status: 404, description: 'Carrito o ítem no encontrado' })
  async updateItem(
    @Req() req: Request,
    @Headers('x-cart-token') xCartToken: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const userId = (req as any).user?.userId || (req as any).user?.id || null;
    const { cart } = await this.cartService.resolveCart(userId, xCartToken, false);
    return this.cartService.updateItemQuantity(cart.id, itemId, dto.quantity);
  }

  @Delete('items/:itemId')
  @UseGuards(OptionalCustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un ítem del carrito' })
  @ApiResponse({ status: 200, description: 'Ítem eliminado exitosamente', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Carrito o ítem no encontrado' })
  async removeItem(
    @Req() req: Request,
    @Headers('x-cart-token') xCartToken: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<CartResponseDto> {
    const userId = (req as any).user?.userId || (req as any).user?.id || null;
    const { cart } = await this.cartService.resolveCart(userId, xCartToken, false);
    return this.cartService.removeItem(cart.id, itemId);
  }

  @Delete()
  @UseGuards(OptionalCustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vaciar todos los ítems del carrito' })
  @ApiResponse({ status: 200, description: 'Carrito vaciado exitosamente', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado' })
  async clearCart(
    @Req() req: Request,
    @Headers('x-cart-token') xCartToken: string,
  ): Promise<CartResponseDto> {
    const userId = (req as any).user?.userId || (req as any).user?.id || null;
    const { cart } = await this.cartService.resolveCart(userId, xCartToken, false);
    return this.cartService.clearCart(cart.id);
  }

  @Post('merge')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fusionar carrito de visitante con el carrito del usuario autenticado (usar después del login)',
  })
  @ApiResponse({ status: 200, description: 'Carrito fusionado exitosamente', type: CartResponseDto })
  @ApiResponse({ status: 400, description: 'Token del carrito no válido o stock insuficiente en la fusión' })
  async mergeCart(
    @Req() req: Request,
    @Headers('x-cart-token') xCartToken: string,
  ): Promise<CartResponseDto> {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return this.cartService.mergeGuestCartIntoUserCart(userId, xCartToken);
  }
}
