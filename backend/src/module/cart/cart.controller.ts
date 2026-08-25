import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  Req,
  Res,
  UseGuards,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SingleResponse } from '../../common/interfaces/api-response.interface';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@ApiTags('Carrito de Compras')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiOperation({
    summary:
      'Obtener carrito activo resuelto por JWT autenticado (customerId) o Header X-Cart-Token (visitante)',
  })
  @ApiHeader({
    name: 'X-Cart-Token',
    required: false,
    description: 'Token del carrito de visitante (no requerido si se envía un Bearer JWT válido)',
  })
  @ApiResponse({
    status: 200,
    description: 'Carrito activo obtenido exitosamente',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Token del carrito no válido o expirado (CART_TOKEN_INVALID)',
  })
  async getCart(
    @Req() req: any,
    @Headers('x-cart-token') xCartToken?: string,
  ): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user?.userId ?? null;
    const { cart } = await this.cartService.resolveCart(userId, xCartToken, false);
    return { data: CartResponseDto.fromEntity(cart) };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('items')
  @ApiOperation({
    summary:
      'Agregar un ítem al carrito activo. Si no hay JWT ni X-Cart-Token, genera un nuevo carrito de invitado y devuelve X-Cart-Token en el header de respuesta.',
  })
  @ApiHeader({
    name: 'X-Cart-Token',
    required: false,
    description: 'Token del carrito de visitante existente',
  })
  @ApiResponse({
    status: 201,
    description: 'Ítem agregado exitosamente. Retorna X-Cart-Token en headers si es la creación inicial de un invitado.',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos no válidos, variante no pertenece al producto, o CART_TOKEN_INVALID',
  })
  async addItem(
    @Req() req: any,
    @Headers('x-cart-token') xCartToken: string | undefined,
    @Body() addCartItemDto: AddCartItemDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user?.userId ?? null;
    const { cart, createdGuestToken } = await this.cartService.resolveCart(
      userId,
      xCartToken,
      true,
    );

    if (createdGuestToken) {
      res.setHeader('X-Cart-Token', createdGuestToken);
    }

    const updatedCart = await this.cartService.addItemToCart(cart.id, addCartItemDto);
    return { data: updatedCart };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('merge')
  @ApiOperation({
    summary:
      'Fusionar el carrito de visitante (vía header X-Cart-Token) con el carrito activo del cliente autenticado (vía Bearer JWT)',
  })
  @ApiHeader({
    name: 'X-Cart-Token',
    required: true,
    description: 'Token del carrito de visitante a fusionar',
  })
  @ApiResponse({
    status: 200,
    description: 'Carrito fusionado exitosamente. Retorna el carrito autenticado recalculado.',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Token de invitado no válido/expirado (CART_TOKEN_INVALID) o stock insuficiente (STOCK_INSUFFICIENT)',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Requiere Bearer JWT de cliente autenticado',
  })
  async mergeCart(
    @Req() req: any,
    @Headers('x-cart-token') xCartToken: string | undefined,
  ): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Se requiere estar autenticado para fusionar un carrito de invitado',
      });
    }

    const mergedCart = await this.cartService.mergeGuestCartIntoUserCart(userId, xCartToken);
    return { data: mergedCart };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Actualizar la cantidad de un ítem en el carrito activo por su ID (UUID)' })
  @ApiHeader({
    name: 'X-Cart-Token',
    required: false,
    description: 'Token del carrito de visitante',
  })
  @ApiResponse({
    status: 200,
    description: 'Cantidad actualizada exitosamente',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cantidad no válida o CART_TOKEN_INVALID',
  })
  async updateItemQuantity(
    @Req() req: any,
    @Headers('x-cart-token') xCartToken: string | undefined,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user?.userId ?? null;
    const { cart } = await this.cartService.resolveCart(userId, xCartToken, false);
    const updatedCart = await this.cartService.updateItemQuantity(
      cart.id,
      itemId,
      updateCartItemDto.quantity,
    );
    return { data: updatedCart };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Eliminar un ítem explícitamente del carrito activo por su ID (UUID)' })
  @ApiHeader({
    name: 'X-Cart-Token',
    required: false,
    description: 'Token del carrito de visitante',
  })
  @ApiResponse({
    status: 200,
    description: 'Ítem eliminado exitosamente',
    type: CartResponseDto,
  })
  async removeItem(
    @Req() req: any,
    @Headers('x-cart-token') xCartToken: string | undefined,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user?.userId ?? null;
    const { cart } = await this.cartService.resolveCart(userId, xCartToken, false);
    const updatedCart = await this.cartService.removeItem(cart.id, itemId);
    return { data: updatedCart };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Delete()
  @ApiOperation({ summary: 'Vaciar todos los ítems del carrito activo' })
  @ApiHeader({
    name: 'X-Cart-Token',
    required: false,
    description: 'Token del carrito de visitante',
  })
  @ApiResponse({
    status: 200,
    description: 'Carrito vaciado exitosamente',
    type: CartResponseDto,
  })
  async clearCart(
    @Req() req: any,
    @Headers('x-cart-token') xCartToken: string | undefined,
  ): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user?.userId ?? null;
    const { cart } = await this.cartService.resolveCart(userId, xCartToken, false);
    const updatedCart = await this.cartService.clearCart(cart.id);
    return { data: updatedCart };
  }
}