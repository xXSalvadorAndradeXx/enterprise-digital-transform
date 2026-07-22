import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; 
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { AuthController } from './auth.controller';
import { HashService } from './hash.service';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { JwtStrategy } from './jwt.strategy'; // 1. Importación de la estrategia
import { LocalStrategy } from './local.strategy';
import { AuthService } from './auth.service';

import { JwtAuthGuard, RolesGuard, PermissionsGuard } from './guards';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Cart]),
    
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const expiresIn = config.get<string>('JWT_EXPIRES_IN', '15m');
        const refreshSecret = config.get<string>('JWT_REFRESH_SECRET');
        const refreshExpiresIn = config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, HashService, JwtStrategy, LocalStrategy, JwtAuthGuard, RolesGuard, PermissionsGuard],
  exports: [AuthService, HashService, JwtModule, JwtStrategy, LocalStrategy, JwtAuthGuard, RolesGuard, PermissionsGuard],
})
export class AuthModule {}