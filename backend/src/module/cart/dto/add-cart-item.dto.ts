import { IsInt, Min, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890',
    description: 'UUID del producto a agregar',
  })
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @ApiProperty({
    example: 'f1e2d3c4-b5a6-4000-a000-ef9876543210',
    description: 'UUID de la variante seleccionada del producto',
  })
  @IsNotEmpty()
  @IsUUID()
  variantId!: string;

  @ApiProperty({
    example: 2,
    description: 'Cantidad a agregar al carrito (debe ser un entero mayor o igual a 1)',
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;
}
