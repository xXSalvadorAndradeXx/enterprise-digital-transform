import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SingleResponse } from '../../common/interfaces/api-response.interface';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';

@ApiTags('Carrito de Compras')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener o crear carrito activo del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Carrito activo obtenido exitosamente',
    type: CartResponseDto,
  })
  async getCart(@Request() req): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user.userId;
    const cart = await this.cartService.findOrCreateCartForUser(userId);
    return { data: CartResponseDto.fromEntity(cart) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  @ApiOperation({ summary: 'Agregar un ítem al carrito activo o acumular su cantidad si la variante ya existe' })
  @ApiResponse({
    status: 201,
    description: 'Ítem agregado o acumulado exitosamente',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos no válidos, variante no pertenece al producto o carrito no activo',
  })
  async addItem(
    @Request() req,
    @Body() addCartItemDto: AddCartItemDto,
  ): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user.userId;
    const cart = await this.cartService.findOrCreateCartForUser(userId);
    const updatedCart = await this.cartService.addItemToCart(cart.id, addCartItemDto);
    return { data: updatedCart };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Actualizar la cantidad de un ítem en el carrito activo por su ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Cantidad actualizada exitosamente',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cantidad no válida (debe ser mayor que 0) o carrito no activo',
  })
  async updateItemQuantity(
    @Request() req,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user.userId;
    const cart = await this.cartService.findOrCreateCartForUser(userId);
    const updatedCart = await this.cartService.updateItemQuantity(
      cart.id,
      itemId,
      updateCartItemDto.quantity,
    );
    return { data: updatedCart };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Eliminar un ítem explícitamente del carrito activo por su ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Ítem eliminado exitosamente',
    type: CartResponseDto,
  })
  async removeItem(
    @Request() req,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user.userId;
    const cart = await this.cartService.findOrCreateCartForUser(userId);
    const updatedCart = await this.cartService.removeItem(cart.id, itemId);
    return { data: updatedCart };
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiOperation({ summary: 'Vaciar todos los ítems del carrito activo' })
  @ApiResponse({
    status: 200,
    description: 'Carrito vaciado exitosamente',
    type: CartResponseDto,
  })
  async clearCart(@Request() req): Promise<SingleResponse<CartResponseDto>> {
    const userId = req.user.userId;
    const cart = await this.cartService.findOrCreateCartForUser(userId);
    const updatedCart = await this.cartService.clearCart(cart.id);
    return { data: updatedCart };
  }
}