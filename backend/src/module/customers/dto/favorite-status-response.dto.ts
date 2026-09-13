import { ApiProperty } from '@nestjs/swagger';

export class FavoriteStatusResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890',
    description: 'UUID del producto consultado',
  })
  productId!: string;

  @ApiProperty({
    example: true,
    description:
      'Indica si el producto está guardado en los favoritos del cliente autenticado (estado del botón de corazón)',
  })
  isFavorite!: boolean;
}
