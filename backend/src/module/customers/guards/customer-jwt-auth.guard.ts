// src/module/customers/guards/customer-jwt-auth.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (err) {
        throw err;
      }
      const isExpired =
        info?.name === 'TokenExpiredError' ||
        (typeof info?.message === 'string' &&
          info.message.toLowerCase().includes('expired'));

      throw new UnauthorizedException({
        statusCode: 401,
        code: isExpired ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED',
        message: isExpired
          ? 'El token de acceso ha expirado.'
          : 'Acceso no autorizado. Token inválido o inexistente.',
        error: 'Unauthorized',
      });
    }
    return user;
  }
}
