import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';

import { CustomerOrdersService } from '../services/customer-orders.service';
import { CustomerJwtAuthGuard } from '../../customers/guards/customer-jwt-auth.guard';
import { CurrentCustomer } from '../../customers/decorators/current-customer.decorator';
import type { CurrentCustomerPayload } from '../../customers/decorators/current-customer.decorator';
import { CustomerOrdersQueryDto } from '../dto/customer-orders-query.dto';
import {
  CustomerOrdersPaginatedResponseDto,
  CustomerOrderDetailWrappedResponseDto,
  CustomerOrderErrorResponseDto,
} from '../dto/customer-order-response-wrappers.dto';

@ApiTags('Customer Orders')
@ApiBearerAuth()
@UseGuards(CustomerJwtAuthGuard)
@Controller('customers/me/orders')
export class CustomerOrdersController {
  constructor(private readonly customerOrdersService: CustomerOrdersService) {}

  @Get()
  @ApiOperation({
    summary:
      'Obtener historial de órdenes del cliente autenticado con resumen de artículos',
    description:
      'Retorna la lista paginada de compras realizadas por el cliente autenticado con resumen de artículos (items[]), conteo total de piezas (itemsCount), métodos de pago/entrega y metadata de paginación para renderizar tarjetas en Frontend sin realizar múltiples consultas. El parámetro customerId no es aceptado por query ya que se deriva estrictamente del token JWT.',
  })
  @ApiOkResponse({
    description:
      'Historial de órdenes obtenido exitosamente con tarjetas de resumen y metadata de paginación.',
    type: CustomerOrdersPaginatedResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Parámetros de consulta inválidos (ej. page < 1, limit > 100, status o sortOrder inválidos).',
    type: CustomerOrderErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'No autorizado: Token de cliente ausente, inválido o expirado.',
    type: CustomerOrderErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Cliente especificado en el token no encontrado o eliminado.',
    type: CustomerOrderErrorResponseDto,
  })
  async getMyOrders(
    @CurrentCustomer() customer: CurrentCustomerPayload,
    @Query() query: CustomerOrdersQueryDto,
  ) {
    const { orders, meta } = await this.customerOrdersService.findAllByCustomer(
      customer.id,
      query,
    );

    return {
      success: true,
      data: {
        items: orders,
        meta,
      },
    };
  }

  @Get(':orderNumber')
  @ApiOperation({
    summary: 'Obtener el detalle de una orden del cliente por número de orden',
    description:
      'Retorna la información completa de la orden solo si pertenece al cliente autenticado. Para prevenir ataques de enumeración (IDOR), si la orden no existe o pertenece a otro cliente se retorna 404 ORDER_NOT_FOUND.',
  })
  @ApiParam({
    name: 'orderNumber',
    description:
      'Número público legible único de la orden (8 caracteres alfanuméricos, ej. A7K29P4Q)',
    example: 'A7K29P4Q',
  })
  @ApiOkResponse({
    description:
      'Detalle histórico completo de la orden obtenido exitosamente.',
    type: CustomerOrderDetailWrappedResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Número de orden inválido o malformado.',
    type: CustomerOrderErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'No autorizado: Token de cliente ausente, inválido o expirado.',
    type: CustomerOrderErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No se encontró la orden solicitada (orden inexistente o no perteneciente al cliente autenticado para mitigar vectores de enumeración).',
    type: CustomerOrderErrorResponseDto,
  })
  async getMyOrderDetail(
    @CurrentCustomer() customer: CurrentCustomerPayload,
    @Param('orderNumber') orderNumber: string,
  ) {
    const trimmedOrderNumber = (orderNumber || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(trimmedOrderNumber)) {
      throw new BadRequestException({
        code: 'INVALID_ORDER_NUMBER',
        message:
          'El número de orden provisto es inválido o no cumple el formato esperado (8 caracteres alfanuméricos)',
      });
    }

    const orderDetail = await this.customerOrdersService.findOneByOrderNumber(
      customer.id,
      trimmedOrderNumber,
    );

    return {
      success: true,
      data: orderDetail,
    };
  }
}
