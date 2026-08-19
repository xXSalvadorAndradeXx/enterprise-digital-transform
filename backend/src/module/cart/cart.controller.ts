import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SingleResponse } from '../../common/interfaces/api-response.interface';
import { Cart } from './entities/cart.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';


@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCart(@Request() req): Promise<SingleResponse<Cart>> {
    const userId = req.user.userId;
    const userCart = await this.cartService.findUserCart(userId);
    return { data: userCart };
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  async addItem(@Request() req, @Body() addCartItemDto: AddCartItemDto): Promise<SingleResponse<Cart>> {
    const userId = req.user.userId;
    const updatedCart = await this.cartService.addItemToCart(userId, addCartItemDto);
    return { data: updatedCart };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items/:itemId')
  async updateItemQuantity(
    @Request() req,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<SingleResponse<Cart>> {
    const userId = req.user.userId;
    const updatedCart = await this.cartService.updateItemQuantity(userId, itemId, updateCartItemDto.quantity);
    return { data: updatedCart };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:itemId')
  async removeItem(
    @Request() req,
    @Param('itemId', ParseIntPipe) itemId: number,
  ): Promise<SingleResponse<Cart>> {
    const userId = req.user.userId;
    const updatedCart = await this.cartService.removeItem(userId, itemId);
    return { data: updatedCart };
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async clearCart(@Request() req): Promise<SingleResponse<Cart>> {
    const userId = req.user.userId;
    const updatedCart = await this.cartService.clearCart(userId);
    return { data: updatedCart };
  }
}