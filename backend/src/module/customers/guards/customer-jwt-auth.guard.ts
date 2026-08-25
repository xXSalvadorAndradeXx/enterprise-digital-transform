// src/module/customers/guards/customer-jwt-auth.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException({
        statusCode: 401,
        message: 'Acceso no autorizado. Token inválido o inexistente.',
        error: 'Unauthorized',
      });
    }
    return user;
  }
}
