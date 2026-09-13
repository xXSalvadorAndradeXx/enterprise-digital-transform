import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentCustomerPayload {
  id: string;
  customerId: string;
  email: string;
  fullName: string;
  phone?: string;
  dui?: string;
  createdAt?: Date;
  type: 'CUSTOMER';
}

export const CurrentCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentCustomerPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
