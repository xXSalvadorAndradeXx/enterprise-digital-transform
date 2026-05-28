import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard) // 🔒 todos los endpoints de cart requieren JWT
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@Request() req) {
    // req.user lo inyecta JwtStrategy.validate()
    return this.cartService.getCart(req.user.id);
  }

  @Post('add')
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }
}