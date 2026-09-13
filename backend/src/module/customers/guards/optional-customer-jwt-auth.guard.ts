import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalCustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const hasBearerToken = /^Bearer\s+\S+/i.test(
      String(request.headers?.authorization ?? ''),
    );

    // El guard es opcional únicamente cuando no se envió autenticación.
    // Si llegó un Bearer inválido o vencido, debe responder 401 para que el
    // cliente renueve la sesión; degradarlo a invitado rompe carrito/checkout.
    if (!user && hasBearerToken) {
      const isExpired =
        info?.name === 'TokenExpiredError' ||
        (typeof info?.message === 'string' &&
          info.message.toLowerCase().includes('expired'));

      throw new UnauthorizedException({
        statusCode: 401,
        code: isExpired ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED',
        message: isExpired
          ? 'El token de acceso ha expirado.'
          : 'Acceso no autorizado. Token inválido.',
        error: 'Unauthorized',
      });
    }

    if (err || !user) {
      return null;
    }

    return user;
  }
}
