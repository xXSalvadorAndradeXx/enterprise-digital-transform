import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SingleResponse } from '../common/interfaces/api-response.interface';
import { Cart } from './entities/cart.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCart(@Request() req): Promise<SingleResponse<Cart>> {
   
    const userId = req.user.sub;
    
    const userCart = await this.cartService.findUserCart(userId);
    
    return { data: userCart };
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  async addItem(@Request() req, @Body() addCartItemDto: AddCartItemDto): Promise<SingleResponse<Cart>> {
    const userId = req.user.sub;
    const updatedCart = await this.cartService.addItemToCart(userId, addCartItemDto);
    return { data: updatedCart };
  }
}