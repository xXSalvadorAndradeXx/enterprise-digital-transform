import { Controller, Get, Post, Body, Param, Patch, Req, Headers, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiParam } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { OptionalCustomerJwtAuthGuard } from '../customers/guards/optional-customer-jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Post('checkout')
  @ApiOperation({
    summary: 'Procesar el checkout definitivo de una orden',
    description: 'Crea la orden de compra y el pago, consumiendo stock de forma atómica e idempotente. Soporta origen CART y BUY_NOW para usuarios autenticados o invitados.',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'UUID v4 único para evitar duplicación de transacciones en escenarios de reintento o doble clic.',
  })
  @ApiHeader({
    name: 'X-Cart-Token',
    required: false,
    description: 'Token del carrito para completar el checkout como invitado',
  })
  @ApiResponse({
    status: 201,
    description: 'Orden y pago creados exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Error por datos inválidos o stock insuficiente (STOCK_INSUFFICIENT)',
  })
  @ApiResponse({
    status: 409,
    description: 'Fluctuación de precios detectada (PRICE_CHANGED) o reuso incorrecto de llave idempotente (IDEMPOTENCY_KEY_REUSED, CHECKOUT_ALREADY_PROCESSING)',
  })
  async checkout(
    @Body() checkoutDto: CheckoutDto,
    @Req() req: any,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-cart-token') xCartToken?: string,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException({
        message: 'El header Idempotency-Key es requerido',
        code: 'MISSING_IDEMPOTENCY_KEY',
      });
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      throw new BadRequestException({
        message: 'El header Idempotency-Key debe ser un UUID v4 válido',
        code: 'INVALID_IDEMPOTENCY_KEY',
      });
    }

    // Si hay un usuario autenticado en la request (ej. por JwtAuthGuard), pasamos su ID
    const userId = req.user?.id;
    return this.ordersService.checkout(
      checkoutDto,
      userId,
      idempotencyKey,
      xCartToken,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Crear una orden directamente (interno / legado)' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @UseGuards(OptionalCustomerJwtAuthGuard)
  @Get(':orderNumber')
  @ApiOperation({
    summary: 'Consultar detalles de una orden mediante su orderNumber',
    description: 'Permite consultar una orden asociada al JWT del cliente propietario o mediante X-Order-Access-Token para pedidos de invitados.',
  })
  @ApiParam({
    name: 'orderNumber',
    description: 'Número único de orden (ej. A7K29P4Q)',
  })
  @ApiHeader({
    name: 'X-Order-Access-Token',
    required: false,
    description: 'Token criptográfico para autorizar acceso a órdenes creadas por invitados',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles de la orden retornados exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Acceso no autorizado debido a falta de token (ORDER_ACCESS_TOKEN_REQUIRED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Permiso denegado para consultar la orden (ORDER_FORBIDDEN)',
  })
  @ApiResponse({
    status: 404,
    description: 'Orden no encontrada (ORDER_NOT_FOUND)',
  })
  async findOneByOrderNumber(
    @Param('orderNumber') orderNumber: string,
    @Req() req: any,
    @Headers('x-order-access-token') accessToken?: string,
  ) {
    return this.ordersService.findOneByOrderNumber(orderNumber, req.user, accessToken);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de una orden por ID' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}


