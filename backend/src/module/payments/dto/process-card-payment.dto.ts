import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, IsOptional } from 'class-validator';

export class ProcessCardPaymentDto {
  @ApiProperty({
    description: 'Los últimos 4 dígitos de la tarjeta utilizada para la transacción',
    example: '4321',
  })
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/, { message: 'cardLastFour debe contener exactamente 4 dígitos' })
  cardLastFour!: string;

  @ApiProperty({
    description: 'La marca/franquicia de la tarjeta (ej. Visa, Mastercard)',
    example: 'Visa',
  })
  @IsString()
  cardBrand!: string;

  @ApiProperty({
    description: 'ID de transacción opcional retornado por la pasarela de pagos',
    example: 'txn_1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    description: 'Referencia externa opcional retornada por la pasarela de pagos',
    example: 'ref_0987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiProperty({
    description: 'El código de respuesta retornado por el procesador/adquiriente',
    example: '00',
    required: false,
  })
  @IsOptional()
  @IsString()
  responseCode?: string;
}
