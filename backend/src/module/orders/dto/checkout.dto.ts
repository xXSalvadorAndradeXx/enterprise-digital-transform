import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsString,
  IsEmail,
  IsInt,
  Min,
  ArrayNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CheckoutSource } from '../enums/checkout-source.enum';
import { DeliveryType } from '../enums/delivery-type.enum';
import { PaymentMethod } from '../../payments/enums/payment-method.enum';

export class CheckoutItemDto {
  @ApiProperty({
    description: 'El UUID de la variante del producto',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  variantId!: string;

  @ApiProperty({
    description: 'La cantidad a comprar (mínimo 1)',
    example: 2,
  })
  @IsInt()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  quantity!: number;

  @ApiProperty({
    description: 'Precio de referencia del producto al agregarlo (opcional para control de fluctuaciones)',
    example: '10.00',
    required: false,
  })
  @IsOptional()
  @IsString()
  priceAtAdded?: string;
}

export class CheckoutContactDto {
  @ApiProperty({
    description: 'Nombre completo del comprador',
    example: 'Juan Pérez',
  })
  @IsString()
  fullName!: string;

  @ApiProperty({
    description: 'Correo electrónico de contacto',
    example: 'juan.perez@example.com',
  })
  @IsEmail({}, { message: 'El correo electrónico debe ser una dirección válida' })
  email!: string;

  @ApiProperty({
    description: 'Número telefónico de contacto',
    example: '+50371234567',
  })
  @IsString()
  phone!: string;

  @ApiProperty({
    description: 'Documento único de identidad (DUI) del comprador',
    example: '01234567-9',
    required: false,
  })
  @IsOptional()
  @IsString()
  dui?: string;
}

export class CheckoutDeliveryDto {
  @ApiProperty({
    enum: DeliveryType,
    description: 'Tipo de entrega de la orden',
    example: DeliveryType.HOME_DELIVERY,
  })
  @IsEnum(DeliveryType)
  deliveryType!: DeliveryType;

  @ApiProperty({
    description: 'ID de departamento (obligatorio para entrega a domicilio)',
    example: 'SS',
    required: false,
  })
  @ValidateIf(o => o.deliveryType === DeliveryType.HOME_DELIVERY)
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({
    description: 'ID de distrito (obligatorio para entrega a domicilio)',
    example: 'SS-01',
    required: false,
  })
  @ValidateIf(o => o.deliveryType === DeliveryType.HOME_DELIVERY)
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiProperty({
    description: 'Ciudad o municipio (obligatorio para entrega a domicilio)',
    example: 'San Salvador Centro',
    required: false,
  })
  @ValidateIf(o => o.deliveryType === DeliveryType.HOME_DELIVERY)
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Dirección exacta (obligatoria para entrega a domicilio)',
    example: 'Calle al Volcán, No. 12',
    required: false,
  })
  @ValidateIf(o => o.deliveryType === DeliveryType.HOME_DELIVERY)
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiProperty({
    description: 'UUID de la sucursal (obligatorio para retiro en tienda)',
    example: '123e4567-e89b-12d3-a456-426614174888',
    required: false,
  })
  @ValidateIf(o => o.deliveryType === DeliveryType.STORE_PICKUP)
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({
    description: 'Establecer esta dirección como predeterminada (solo para HOME_DELIVERY)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CheckoutCardDto {
  @ApiProperty({
    description: 'Los últimos 4 dígitos de la tarjeta',
    example: '4321',
  })
  @IsString()
  cardLastFour!: string;

  @ApiProperty({
    description: 'La marca de la tarjeta (ej. Visa, Mastercard)',
    example: 'Visa',
  })
  @IsString()
  cardBrand!: string;

  @ApiProperty({
    description: 'Token seguro de tarjeta del procesador (alternativo a datos de tarjeta)',
    example: 'tok_sandbox_12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  cardToken?: string;

  @ApiProperty({
    description: 'Flag para simular el resultado exitoso (true) o fallido (false) del pago con tarjeta',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  simulateSuccess?: boolean;
}

export class CheckoutDto {
  @ApiProperty({
    enum: CheckoutSource,
    description: 'Origen del checkout (carrito o compra directa)',
    example: CheckoutSource.CART,
  })
  @IsEnum(CheckoutSource)
  source!: CheckoutSource;

  @ApiProperty({
    type: [CheckoutItemDto],
    description: 'Lista de ítems (obligatorio solo para BUY_NOW)',
    required: false,
  })
  @ValidateIf(o => o.source === CheckoutSource.BUY_NOW)
  @IsArray()
  @ArrayNotEmpty({ message: 'Los ítems son obligatorios cuando source es BUY_NOW' })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items?: CheckoutItemDto[];

  @ApiProperty({
    type: CheckoutContactDto,
    description: 'Información de contacto del comprador',
  })
  @ValidateNested()
  @Type(() => CheckoutContactDto)
  contact!: CheckoutContactDto;

  @ApiProperty({
    type: CheckoutDeliveryDto,
    description: 'Datos de envío o entrega',
  })
  @ValidateNested()
  @Type(() => CheckoutDeliveryDto)
  delivery!: CheckoutDeliveryDto;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Método de pago de la orden',
    example: PaymentMethod.CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiProperty({
    type: CheckoutCardDto,
    description: 'Datos seguros de tarjeta (obligatorio si paymentMethod es CARD)',
    required: false,
  })
  @ValidateIf(o => o.paymentMethod === PaymentMethod.CARD)
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutCardDto)
  card?: CheckoutCardDto;

  @ApiProperty({
    description: 'Indica si se debe guardar la dirección (solo para HOME_DELIVERY y usuario autenticado)',
    example: true,
    required: false,
  })
  @ValidateIf(o => o.source === CheckoutSource.CART)
  @IsOptional()
  @IsBoolean()
  saveAddress?: boolean;
}
