// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Login ────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, meta: { userAgent?: string; ip?: string }) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Cuenta bloqueada hasta ${user.lockedUntil.toISOString()}`,
      );
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    await this.resetFailedAttempts(user);
    return this.generateTokenPair(user, meta);
  }

  // ── Refresh ──────────────────────────────────────────────────────────────

  async refresh(dto: RefreshTokenDto, userId: string) {
    const tokenHash = this.hashToken(dto.refreshToken);

    const stored = await this.refreshTokenRepo.findOne({
      where: { userId, tokenHash, isRevoked: false },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    await this.refreshTokenRepo.update(stored.id, { isRevoked: true });

    const user = await this.usersService.findOne(userId);
    return this.generateTokenPair(user, {});
  }

  // ── Logout ───────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  // ── Change password ──────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findOne(userId);

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new ForbiddenException('Contraseña actual incorrecta');

    const newHash = await bcrypt.hash(dto.newPassword, 12);

    await this.usersService['userRepo'].update(userId, {
      passwordHash:        newHash,
      mustChangePassword:  false,
      failedLoginAttempts: 0,
    });

    await this.logout(userId);
  }

  // ── Get me ───────────────────────────────────────────────────────────────

  async getMe(userId: string) {
    const user = await this.usersService.findOne(userId);
    return {
      id:                 user.id,
      firstName:          user.firstName,
      lastName:           user.lastName,
      email:              user.email,
      roles:              user.roles.map((r) => r.name),
      permissions:        user.effectivePermissions,
      mustChangePassword: user.mustChangePassword,
    };
  }

  // ── Forgot password ──────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    // Respuesta genérica siempre — nunca revelar si el email existe
    if (!user || !user.isActive) return;

    // Invalidar tokens anteriores pendientes
    await this.resetTokenRepo.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    const rawToken  = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.resetTokenRepo.save(
      this.resetTokenRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      }),
    );

    // TODO: reemplazar por MailerService cuando esté configurado en el proyecto
    const resetUrl = `${this.configService.get('app.frontendUrl')}/reset-password?token=${rawToken}`;
    console.log(`[DEV] Reset URL para ${email}: ${resetUrl}`);
  }

  // ── Reset password ───────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);

    const stored = await this.resetTokenRepo.findOne({
      where: { tokenHash, isUsed: false },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Marcar como usado ANTES de actualizar — previene replay attacks
    await this.resetTokenRepo.update(stored.id, { isUsed: true });

    const newHash = await bcrypt.hash(dto.newPassword, 12);

    await this.usersService['userRepo'].update(stored.userId, {
      passwordHash:        newHash,
      mustChangePassword:  false,
      failedLoginAttempts: 0,
      lockedUntil:         null,
    });

    await this.logout(stored.userId);
  }

  // ── Helpers privados ─────────────────────────────────────────────────────

  private async generateTokenPair(
    user: User,
    meta: { userAgent?: string; ip?: string },
  ) {
    const payload = {
      sub:         user.id,
      email:       user.email,
      roles:       user.roles.map((r) => r.name),
      permissions: user.effectivePermissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret:    this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash    = this.hashToken(refreshToken);
    const expiresIn    = this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const expiresAt    = this.parseExpiry(expiresIn);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId:    user.id,
        tokenHash,
        expiresAt,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ip ?? null,
      }),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn:          this.configService.get<string>('jwt.expiresIn'),
      mustChangePassword: user.mustChangePassword,
      user: {
        id:          user.id,
        firstName:   user.firstName,
        lastName:    user.lastName,
        email:       user.email,
        roles:       user.roles.map((r) => r.name),
        permissions: user.effectivePermissions,
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(expiry: string): Date {
    const unit  = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    const ms    = unit === 'd' ? value * 86400000
                : unit === 'h' ? value * 3600000
                : unit === 'm' ? value * 60000
                : value * 1000;
    return new Date(Date.now() + ms);
  }

  private async handleFailedLogin(user: User): Promise<void> {
    const attempts = user.failedLoginAttempts + 1;
    const update: Partial<User> = { failedLoginAttempts: attempts };

    if (attempts >= 5) {
      update.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await this.usersService['userRepo'].update(user.id, update);
  }

  private async resetFailedAttempts(user: User): Promise<void> {
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.usersService['userRepo'].update(user.id, {
        failedLoginAttempts: 0,
        lockedUntil:         null,
      });
    }
  }
}