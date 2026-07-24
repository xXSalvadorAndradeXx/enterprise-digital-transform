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
      .addSelect('user.password_hash')
      .where('user.email = :email', { email })
      .getOne();

    if (user) {
      // Delegar la verificación del estado de cuenta/lockout a AuthService
      this.authService.checkLockout(user);

      const isPasswordMatching = await bcrypt.compare(password, user.passwordHash);
      if (isPasswordMatching) {
        const { passwordHash: _, ...result } = user;
        return result;
      }
    }

    throw new UnauthorizedException('Credenciales inválidas');
  }
}
