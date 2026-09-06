import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890',
    description: 'UUID v4 del producto a agregar a favoritos',
  })
  @IsNotEmpty({ message: 'El productId es obligatorio' })
  @IsUUID('4', { message: 'El productId debe ser un UUID v4 válido' })
  productId!: string;
}

export { CreateFavoriteDto as AddFavoriteDto };
