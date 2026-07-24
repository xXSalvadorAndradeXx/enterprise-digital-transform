import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      let message = 'Acceso no autorizado. Token inválido o inexistente.';

      if (info && info.name === 'TokenExpiredError') {
        message = 'El token ha expirado. Por favor inicia sesión nuevamente.';
      } else if (info && info.name === 'JsonWebTokenError') {
        message = 'Firma de token inválida o token malformado.';
      }

      throw (
        err ||
        new UnauthorizedException({
          statusCode: 401,
          message,
          error: 'Unauthorized',
        })
      );
    }
    return user;
  }
}