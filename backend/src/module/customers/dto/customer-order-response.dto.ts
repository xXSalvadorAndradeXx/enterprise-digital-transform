import { Expose } from 'class-transformer';

export class CustomerOrderResponseDto {
  @Expose()
  id!: string;

  @Expose()
  orderNumber!: string;

  @Expose()
  status!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  deliveryType!: string;

  @Expose()
  total!: string;

  @Expose()
  totalItems!: number;
}
