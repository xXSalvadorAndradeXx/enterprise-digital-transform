import { IsInt, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;
}
