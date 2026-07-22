import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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
    const user = await this.userRepository.findOneBy({ id: payload.sub });

    if (!user || !user.isActive || user.isBlocked) {
      throw new UnauthorizedException(
        'Acceso no autorizado. Token inválido o cuenta inactiva.',
      );
    }

    const roles = [user.rol];
    const permissions =
      user.rol === 'administrador'
        ? ['create', 'read', 'update', 'delete', 'admin']
        : ['read', 'create:order'];

    return {
      id: user.id,
      userId: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      roles,
      permissions,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
    };
  }
}