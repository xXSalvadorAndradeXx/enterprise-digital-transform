import { Controller, Get, Post, Body, Param, Patch, Req, Headers, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post('checkout')
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'UUID v4 que identifica de forma única la transacción de checkout para evitar duplicaciones',
  })
  async checkout(
    @Body() checkoutDto: CheckoutDto,
    @Req() req: any,
    @Headers('idempotency-key') idempotencyKey?: string,
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
    return this.ordersService.checkout(checkoutDto, userId, idempotencyKey);
  }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':orderNumber')
  @ApiHeader({
    name: 'X-Order-Access-Token',
    required: false,
    description: 'Token criptográfico de acceso para consultar pedidos realizados como invitado',
  })
  async findOneByOrderNumber(
    @Param('orderNumber') orderNumber: string,
    @Req() req: any,
    @Headers('x-order-access-token') accessToken?: string,
  ) {
    return this.ordersService.findOneByOrderNumber(orderNumber, req.user, accessToken);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}

