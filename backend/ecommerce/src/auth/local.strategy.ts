import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
  ) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (user) {
      // Delegar la verificación del estado de cuenta/lockout (lanza HTTP 423 si está bloqueada)
      this.authService.checkLockout(user);

      const isPasswordMatching = await bcrypt.compare(password, user.password);

      if (isPasswordMatching) {
        // Reiniciar contador de intentos fallidos a 0
        await this.authService.handleSuccessfulLogin(user);

        const { password: _, ...result } = user;
        return result;
      } else {
        // Incrementar contador de intentos fallidos (+1) y bloquear si alcanza 3
        await this.authService.handleFailedLogin(user);
      }
    }

    throw new UnauthorizedException('Credenciales inválidas');
  }
}
