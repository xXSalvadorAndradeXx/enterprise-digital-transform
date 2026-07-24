import { IsInt, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class AddCartItemDto {
  @Type(() => Number)
  @IsNotEmpty()
  @IsInt()
  productId!: number;

  @Type(() => Number)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;
}
