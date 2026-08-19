import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '../enums/product-status.enum';

export class UpdateProductStatusDto {
  @ApiProperty({
    enum: ProductStatus,
    description: 'Nuevo estado deseado para el producto (ACTIVE, PAUSED, DISCONTINUED)',
    example: ProductStatus.ACTIVE,
  })
  @IsEnum(ProductStatus)
  @IsNotEmpty()
  status!: ProductStatus;
}
