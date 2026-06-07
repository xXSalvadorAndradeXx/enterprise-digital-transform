import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';

import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('add')
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Request() req,
  ) {
    return this.cartService.updateItemQuantity(
      req.user.id,
      itemId,
      dto,
    );
  }

  @Delete('items/:itemId')
  removeItem(
    @Param('itemId') itemId: string,
    @Request() req,
  ) {
    return this.cartService.removeItem(req.user.id, itemId);
  }

  @Delete()
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}