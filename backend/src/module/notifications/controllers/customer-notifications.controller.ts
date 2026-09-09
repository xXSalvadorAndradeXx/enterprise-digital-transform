import {
  Controller,
  Get,
  Patch,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CustomerNotificationsService } from '../services/customer-notifications.service';
import { CustomerJwtAuthGuard } from '../../customers/guards/customer-jwt-auth.guard';
import { CurrentCustomer } from '../../customers/decorators/current-customer.decorator';
import type { CurrentCustomerPayload } from '../../customers/decorators/current-customer.decorator';
import { CustomerNotificationsQueryDto } from '../dto/customer-notifications-query.dto';
import {
  PaginatedCustomerNotificationsResponseDto,
  CustomerNotificationWrappedResponseDto,
  UnreadCountResponseDto,
  MarkAllAsReadResponseDto,
} from '../dto/customer-notification-response.dto';

@ApiTags('Customer Notifications')
@ApiBearerAuth()
@UseGuards(CustomerJwtAuthGuard)
@Controller('customers/me/notifications')
export class CustomerNotificationsController {
  constructor(
    private readonly notificationsService: CustomerNotificationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener el historial de notificaciones del cliente autenticado',
    description:
      'Retorna la lista paginada de notificaciones con soporte para filtrar por pestaña (tab=ALL, ORDERS, OFFERS, SYSTEM) y por estado de lectura (isRead=true/false). Las respuestas vienen enriquecidas con la categoría canónica tab.',
  })
  @ApiOkResponse({
    description: 'Buzón de notificaciones paginado obtenido exitosamente.',
    type: PaginatedCustomerNotificationsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado: Token de cliente ausente, inválido o expirado.',
  })
  async getMyNotifications(
    @CurrentCustomer() customer: CurrentCustomerPayload,
    @Query() query: CustomerNotificationsQueryDto,
  ): Promise<PaginatedCustomerNotificationsResponseDto> {
    const { notifications, meta } = await this.notificationsService.findAll(
      customer.id,
      query,
    );

    return {
      success: true,
      data: {
        notifications,
        meta,
      },
    };
  }

  @Get('unread-count')
  @ApiOperation({
    summary:
      'Obtener contador de notificaciones no leídas para insignias (Badge Count)',
    description:
      'Retorna el total de notificaciones pendientes de lectura del cliente autenticado en tiempo O(1).',
  })
  @ApiOkResponse({
    description: 'Contador de no leídas obtenido exitosamente.',
    type: UnreadCountResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado: Token de cliente ausente o inválido.',
  })
  async getUnreadCount(
    @CurrentCustomer() customer: CurrentCustomerPayload,
  ): Promise<UnreadCountResponseDto> {
    const unreadData = await this.notificationsService.getUnreadCount(
      customer.id,
    );

    return {
      success: true,
      data: unreadData,
    };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar todas las notificaciones del cliente como leídas',
    description:
      'Actualiza en lote todas las notificaciones no leídas del cliente a isRead=true y readAt=now().',
  })
  @ApiOkResponse({
    description: 'Notificaciones marcadas como leídas en lote exitosamente.',
    type: MarkAllAsReadResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado: Token de cliente ausente o inválido.',
  })
  async markAllAsRead(
    @CurrentCustomer() customer: CurrentCustomerPayload,
  ): Promise<MarkAllAsReadResponseDto> {
    const { updatedCount } = await this.notificationsService.markAllAsRead(
      customer.id,
    );

    return {
      success: true,
      data: {
        updatedCount,
      },
    };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar una notificación individual como leída',
    description:
      'Actualiza una notificación específica a isRead=true y registra readAt. Si la notificación no existe o pertenece a otro cliente, devuelve 404 NOTIFICATION_NOT_FOUND para evitar enumeración.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la notificación a marcar como leída',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Notificación marcada como leída exitosamente.',
    type: CustomerNotificationWrappedResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'Notificación no encontrada o no pertenece al cliente autenticado.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado: Token de cliente ausente o inválido.',
  })
  async markAsRead(
    @CurrentCustomer() customer: CurrentCustomerPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CustomerNotificationWrappedResponseDto> {
    const notification = await this.notificationsService.markAsRead(
      customer.id,
      id,
    );

    return {
      success: true,
      data: notification,
    };
  }
}
