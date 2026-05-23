import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SingleResponse } from '../common/interfaces/api-response.interface';
import { Cart } from './entities/cart.entity';

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
}