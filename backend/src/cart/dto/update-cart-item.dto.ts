// src/cart/dto/update-cart-item.dto.ts
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity!: number;
}