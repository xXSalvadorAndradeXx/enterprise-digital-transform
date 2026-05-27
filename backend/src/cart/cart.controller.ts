import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)  // ← todo el controller requiere JWT
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()                    // GET /api/cart
  getCart(@Request() req) {
   
    return this.service.getCart(req.user.id);
  }
}
