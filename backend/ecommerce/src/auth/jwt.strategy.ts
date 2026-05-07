import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rechaza el token si ya expiró
      secretOrKey: configService.get<string>('JWT_SECRET') || 'back4455end',
    });
  }

  // Si el token es válido, Passport llama a este método
  async validate(payload: any) {
    // Lo que retornes aquí se inyectará en el objeto 'req.user'
    return { userId: payload.sub, email: payload.email, rol: payload.rol };
  }
}