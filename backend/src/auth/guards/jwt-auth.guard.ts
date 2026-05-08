import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('El token ha expirado');
    }
    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('Token inválido');
    }
    if (err || !user) {
      throw new UnauthorizedException('No autorizado');
    }
    return user;
  }
}