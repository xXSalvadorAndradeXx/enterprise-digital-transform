import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'El UUID de la orden asociada con el pago',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  orderId!: string;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'El método utilizado para realizar el pago',
    example: PaymentMethod.CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({
    description: 'El código de moneda (ej. USD, EUR)',
    example: 'USD',
    default: 'USD',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
