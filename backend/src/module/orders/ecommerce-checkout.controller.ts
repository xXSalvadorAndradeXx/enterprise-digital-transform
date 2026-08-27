import { Controller, Post, Body, Req, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';

@ApiTags('ecommerce-checkout')
@Controller('ecommerce/checkout')
export class EcommerceCheckoutController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post('preview')
  @ApiOperation({
    summary: 'Obtener previsualización del checkout sin efectos secundarios',
    description: 'Calcula productos, variantes, stock, descuentos, costo de envío y total final. Admite compras directas (BUY_NOW) o mediante carrito (CART) para clientes autenticados o compradores invitados. Retorna montos formateados como string decimal con dos posiciones.',
  })
  @ApiHeader({
    name: 'x-cart-token',
    required: false,
    description: 'Token de carrito para invitados en flujo CART',
  })
  @ApiResponse({
    status: 200,
    description: 'Previsualización calculada con éxito',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            subtotal: { type: 'string', example: '100.00' },
            discountTotal: { type: 'string', example: '10.00' },
            shippingTotal: { type: 'string', example: '4.00' },
            total: { type: 'string', example: '95.00' },
            freeShippingApplied: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'ConflictException debido a cambio de precios durante el checkout',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'PRICE_CHANGED' },
            message: { type: 'string', example: 'Uno o más productos cambiaron de precio' },
            details: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en validaciones geográficas, combinaciones prohibidas o stock insuficiente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Stock insuficiente para el producto' },
        code: { type: 'string', example: 'INSUFFICIENT_STOCK' },
      },
    },
  })
  async preview(
    @Body() checkoutDto: CheckoutDto,
    @Req() req: any,
    @Headers('x-cart-token') xCartToken?: string,
  ) {
    const userId = req.user?.id;
    return this.ordersService.checkoutPreview(checkoutDto, userId, xCartToken);
  }
}

