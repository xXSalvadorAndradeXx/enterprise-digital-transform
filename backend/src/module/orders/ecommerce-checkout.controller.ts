import { Controller, Post, Body, Req, Headers, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';

@Controller('ecommerce/checkout')
export class EcommerceCheckoutController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post('preview')
  async preview(
    @Body() checkoutDto: CheckoutDto,
    @Req() req: any,
    @Headers('x-cart-token') xCartToken?: string,
  ) {
    const userId = req.user?.id;
    return this.ordersService.checkoutPreview(checkoutDto, userId, xCartToken);
  }
}
