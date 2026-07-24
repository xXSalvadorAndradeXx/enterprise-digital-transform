import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const url: string = request.url || request.originalUrl || '';

    if (user && user.mustChangePassword) {
      // Excepciones permitidas cuando mustChangePassword es true: /auth/change-password y /auth/logout
      if (
        url.includes('/auth/change-password') ||
        url.includes('/auth/logout')
      ) {
        return true;
      }

      throw new ForbiddenException(
        'Debe cambiar su contraseña antes de realizar cualquier otra operación en la plataforma',
      );
    }

    return true;
  }
}
