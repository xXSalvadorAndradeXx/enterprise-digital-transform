import { Controller, Patch, Param, Body, Req, UseGuards, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Actualizar estado de una orden desde el panel administrativo' })
  async updateStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Req() req: any,
  ) {
    const changedById = req.user?.id || updateOrderStatusDto.changedById;
    return this.ordersService.updateStatusByOrderNumber(orderNumber, updateOrderStatusDto, changedById);
  }
}
