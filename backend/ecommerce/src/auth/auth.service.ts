import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  /**
   * Verifica el estado de la cuenta (activa / bloqueada / lockout).
   * Lanza una UnauthorizedException si la cuenta está inactiva o bloqueada.
   */
  checkAccountStatus(user: User): void {
    if (!user.isActive || user.isBlocked) {
      throw new UnauthorizedException('La cuenta está bloqueada o inactiva');
    }
  }

  /**
   * Alias de verificación de lockout.
   */
  checkLockout(user: User): void {
    this.checkAccountStatus(user);
  }
}
