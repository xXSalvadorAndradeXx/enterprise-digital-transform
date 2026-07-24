import { IsInt, Min, IsNotEmpty } from 'class-validator';

export class AddCartItemDto {
  @IsNotEmpty()
  @IsInt()
  productId!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;
}
