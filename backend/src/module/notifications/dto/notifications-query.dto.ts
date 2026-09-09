import { IsOptional, IsInt, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationTab } from '../enums/notification-tab.enum';

export class NotificationsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtrar por tipo canónico específico de notificación (ORDER_STATUS_CHANGED, FAVORITE_PRICE_DROPPED, SYSTEM_ANNOUNCEMENT)',
    enum: NotificationType,
    example: NotificationType.ORDER_STATUS_CHANGED,
  })
  @IsOptional()
  @IsEnum(NotificationType, {
    message:
      'El tipo de notificación especificado no es válido (ORDER_STATUS_CHANGED, FAVORITE_PRICE_DROPPED, SYSTEM_ANNOUNCEMENT)',
  })
  type?: NotificationType;

  @ApiPropertyOptional({
    description:
      'Pestaña de interfaz de usuario a consultar (ALL, ORDERS, OFFERS, SYSTEM). Si no se envía ni type ni tab, se consultan todas las notificaciones.',
    enum: NotificationTab,
    default: NotificationTab.ALL,
    example: NotificationTab.ALL,
  })
  @IsOptional()
  @IsEnum(NotificationTab, {
    message: 'La pestaña especificada no es válida (ALL, ORDERS, OFFERS, SYSTEM)',
  })
  tab?: NotificationTab = NotificationTab.ALL;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de lectura (true: leídas, false: no leídas)',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'El valor de isRead debe ser un booleano' })
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Número de página a consultar (mínimo 1)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página (mínimo 1, máximo 50)',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(50, { message: 'El límite no puede exceder los 50 registros' })
  limit?: number = 20;
}
