import {
  Controller,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiBearerAuth,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FindAdminOrdersQueryDto } from './dto/find-admin-orders-query.dto';

@ApiTags('admin-orders')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('orders:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar ventas para el panel administrativo' })
  findAll(@Query() query: FindAdminOrdersQueryDto) {
    return this.ordersService.findAllForAdmin(query);
  }

  @Get(':orderNumber')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('orders:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el detalle de una venta' })
  findOne(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findOneForAdmin(orderNumber);
  }

  @Patch(':orderNumber/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('orders:update')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar estado de una orden desde el panel administrativo',
    description:
      'Actualiza atómicamente el estado de una orden según la máquina de estados canónica. Si la transición es válida y efectiva, emite de forma desacoplada el evento de dominio order.status_changed para notificar al cliente. La solicitud es idempotente (mismo estado resulta en No-Op).',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la orden actualizado exitosamente.',
  })
  @ApiBadRequestResponse({
    description:
      'Transición de estado inválida para el método de entrega de la orden.',
  })
  @ApiNotFoundResponse({
    description: 'El pedido solicitado no existe (code: ORDER_NOT_FOUND).',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación administrativo no provisto o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no cuenta con el permiso administrativo orders:update.',
  })
  async updateStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Req() req: any,
  ) {
    const changedById = req.user?.id || updateOrderStatusDto.changedById;
    const orderResult = await this.ordersService.updateStatusByOrderNumber(
      orderNumber,
      updateOrderStatusDto,
      changedById,
    );

    // Desinfectar respuesta HTTP: No exponer internals del evento de dominio en la API
    if (orderResult && 'domainEvent' in orderResult) {
      delete (orderResult as any).domainEvent;
    }

    return orderResult;
  }
}
