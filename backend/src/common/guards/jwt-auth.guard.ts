import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard de autenticación JWT.
 * TDD § 2.5 y § 9.2 — Protege todos los endpoints que requieren sesión activa.
 * Delega la validación del token a JwtStrategy (passport-jwt).
 *
 * Uso: @UseGuards(JwtAuthGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  /**
   * Personaliza el mensaje de error de autenticación.
   * Si Passport no encuentra un usuario válido, lanza 401.
   */
  handleRequest<TUser = any>(err: any, user: any, _info: any): TUser {
    if (err || !user) {
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException(
            'Token de acceso inválido, expirado o no proporcionado',
          );
    }
    return user as TUser;
  }
}