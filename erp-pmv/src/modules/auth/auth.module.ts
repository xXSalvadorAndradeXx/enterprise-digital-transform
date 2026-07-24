// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, PasswordResetToken]),
    PassportModule,
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.expiresIn') },
      }),
    }),
    UsersModule,
    MailerModule, // <-- esto es todo lo que falta
  ],
  controllers: [AuthController],
  providers:   [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports:     [AuthService],
})
export class AuthModule {}