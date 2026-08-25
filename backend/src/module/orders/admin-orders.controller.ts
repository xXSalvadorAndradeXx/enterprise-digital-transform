import { Controller, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('admin-orders')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
