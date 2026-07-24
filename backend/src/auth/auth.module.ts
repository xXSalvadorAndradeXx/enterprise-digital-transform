import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HashService } from './hash.service';
import { RefreshTokenService } from './refresh-token.service';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { PasswordResetToken } from '../users/entities/password-reset-token.entity';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { MustChangePasswordGuard } from './guards/must-change-password.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Cart, RefreshToken, PasswordResetToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const expiresIn = config.get<string>('JWT_EXPIRES_IN', '15m');

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
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    MustChangePasswordGuard,
    HashService,
    RefreshTokenService,
  ],
  exports: [
    AuthService,
    HashService,
    JwtModule,
    JwtStrategy,
    RefreshTokenService,
  ],
})
export class AuthModule {}