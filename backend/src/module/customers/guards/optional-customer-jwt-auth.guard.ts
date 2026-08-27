import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalCustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null;
    }

    return user;
  }
}
