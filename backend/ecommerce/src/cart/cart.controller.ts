import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async checkConnection(@Request() req) {
    
    const userCart = await this.cartService.findUserCart(req.user.userId);
    
    return {
      status: 'success',
      message: 'Conexión verificada',
      data: userCart,
    };
  }
}