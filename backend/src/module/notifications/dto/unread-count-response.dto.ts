import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnreadCountBreakdownDto {
  @ApiPropertyOptional({
    description: 'Cantidad de notificaciones no leídas de actualización de pedidos',
    example: 2,
  })
  ORDER_STATUS_CHANGED?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de notificaciones no leídas de alertas de precios en favoritos',
    example: 1,
  })
  FAVORITE_PRICE_DROPPED?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de notificaciones no leídas de avisos del sistema',
    example: 0,
  })
  SYSTEM_ANNOUNCEMENT?: number;
}

export class UnreadCountTabBreakdownDto {
  @ApiPropertyOptional({
    description: 'Cantidad de notificaciones no leídas para la pestaña Pedidos',
    example: 2,
  })
  ORDERS?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de notificaciones no leídas para la pestaña Ofertas',
    example: 1,
  })
  OFFERS?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de notificaciones no leídas para la pestaña Sistema',
    example: 0,
  })
  SYSTEM?: number;
}

export class UnreadCountDataDto {
  @ApiProperty({
    description: 'Total global de notificaciones no leídas',
    example: 3,
  })
  unreadCount!: number;

  @ApiPropertyOptional({
    description: 'Desglose granular de notificaciones no leídas por tipo de evento',
    type: UnreadCountBreakdownDto,
  })
  breakdown?: UnreadCountBreakdownDto;

  @ApiPropertyOptional({
    description: 'Desglose de notificaciones no leídas por pestaña de interfaz de usuario',
    type: UnreadCountTabBreakdownDto,
  })
  tabBreakdown?: UnreadCountTabBreakdownDto;
}

export class UnreadCountResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: UnreadCountDataDto })
  data!: UnreadCountDataDto;
}
