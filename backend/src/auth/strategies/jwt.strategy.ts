import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Acceso no autorizado. Usuario no encontrado o inactivo.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Acceso no autorizado. La cuenta se encuentra inactiva.');
    }

    if (user.isBlocked || (user.lockedUntil && new Date() < user.lockedUntil)) {
      throw new UnauthorizedException('Acceso no autorizado. La cuenta se encuentra bloqueada.');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Acceso no autorizado. La sesión ha sido invalidada.');
    }

    return { userId: user.id, email: user.email, rol: payload.rol };
  }
}
