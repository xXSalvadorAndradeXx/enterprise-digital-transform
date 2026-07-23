import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Genera el SHA-256 hash de un token para almacenamiento seguro en BD.
   */
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verifica el estado de la cuenta (activa / bloqueada).
   */
  checkAccountStatus(user: User): void {
    if (user.isBlocked) {
      throw new HttpException(
        'La cuenta se encuentra bloqueada',
        HttpStatus.LOCKED,
      );
    }
    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta se encuentra inactiva');
    }
  }

  /**
   * Alias de verificación de lockout.
   */
  checkLockout(user: User): void {
    this.checkAccountStatus(user);
  }

  /**
   * Emite un Access Token (JWT) con vigencia de 15 minutos.
   */
  async issueAccessToken(user: User): Promise<string> {
    this.checkAccountStatus(user);

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: expiresIn as any,
    });
  }

  /**
   * Genera un Refresh Token (JWT, 7 días), calcula su hash SHA-256 y lo persista en refresh_tokens.
   */
  async issueRefreshToken(userId: string): Promise<string> {
    const payload = {
      sub: userId,
      type: 'refresh',
    };

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const rawRefreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });

    const tokenHash = this.hashToken(rawRefreshToken);

    // Expiración por defecto a 7 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenRecord = this.refreshTokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
      revoked: false,
      replacedByTokenHash: null,
    });

    await this.refreshTokenRepository.save(refreshTokenRecord);

    return rawRefreshToken;
  }

  /**
   * Revoca todos los Refresh Tokens activos de un usuario.
   * Utilizable tanto en logout global como en detección de reutilización maliciosa.
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );
  }

  /**
   * Revoca un Refresh Token específico marcando revoked=true en la BD.
   */
  async revokeToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.refreshTokenRepository.update(
      { tokenHash, revoked: false },
      { revoked: true },
    );
  }

  /**
   * Valida un Refresh Token y realiza la rotación:
   * (a) Verificación de firma y expiración
   * (b) Búsqueda del hash en BD
   * (c) Detección de reutilización (si revoked=true -> invalida todos los tokens del usuario)
   * (d) Rotación exitosa: marca el actual como revocado, asigna replaced_by_token_hash y emite un nuevo par access + refresh
   */
  async validateAndRotate(
    rawToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(rawToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token inválido, alterado o expirado',
      );
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('El token provisto no es un refresh token');
    }

    const tokenHash = this.hashToken(rawToken);
    const tokenRecord = await this.refreshTokenRepository.findOneBy({
      tokenHash,
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token no encontrado en el sistema');
    }

    // (c) Detección de Reutilización Maliciosa (Token ya revocado/rotado previamente)
    if (tokenRecord.revoked) {
      await this.revokeAllUserTokens(tokenRecord.userId);
      throw new UnauthorizedException(
        'Se ha detectado la reutilización de un token revocado. Todas las sesiones activas han sido invalidadas por seguridad.',
      );
    }

    // Comprobar expiración en BD
    if (new Date() > tokenRecord.expiresAt) {
      tokenRecord.revoked = true;
      await this.refreshTokenRepository.save(tokenRecord);
      throw new UnauthorizedException('El refresh token ha expirado');
    }

    // Buscar usuario y verificar estado
    const user = await this.userRepository.findOneBy({ id: tokenRecord.userId });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    this.checkAccountStatus(user);

    // (d) Emitir nuevo Refresh Token
    const newRefreshToken = await this.issueRefreshToken(user.id);
    const newTokenHash = this.hashToken(newRefreshToken);

    // Marcar token actual como revocado y registrar el hash sustituto
    tokenRecord.revoked = true;
    tokenRecord.replacedByTokenHash = newTokenHash;
    await this.refreshTokenRepository.save(tokenRecord);

    // Emitir nuevo Access Token (15 min)
    const newAccessToken = await this.issueAccessToken(user);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }
}
