import { IsInt, Min, IsNotEmpty, IsUUID } from 'class-validator';

export class AddCartItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;
}
