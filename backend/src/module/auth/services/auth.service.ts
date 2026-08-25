import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  UnprocessableEntityException,
  HttpException,
  HttpStatus,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from '../../users/entities/refresh-token.entity';
import { PasswordResetToken } from '../../users/entities/password-reset-token.entity';
import { PASSWORD_COMPLEXITY_REGEX } from '../dto/change-password.dto';
import { Cart } from '../../cart/entities/cart.entity';
import { HashService } from './hash.service';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private forgotPasswordRateLimitMap = new Map<
    string,
    { count: number; resetAt: number }
  >();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly hashService: HashService,
  ) {}

  /**
   * Registro de un nuevo usuario en la plataforma:
   * 1. Verifica si el email ya se encuentra registrado (HTTP 409 Conflict).
   * 2. Hashea la contraseña del usuario.
   * 3. Crea el registro en BD de User y le asigna automáticamente un Cart.
   * 4. Retorna la entidad del usuario recién creado omitiendo la contraseña.
   */
  async register(registerDto: RegisterDto): Promise<Omit<User, 'passwordHash'>> {
    const existingUser = await this.userRepository.findOneBy({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await this.hashService.hashPassword(
      registerDto.password,
    );

    const [firstName, ...lastNameParts] = registerDto.nombre.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    const newUser = this.userRepository.create({
      firstName,
      lastName,
      email: registerDto.email,
      passwordHash: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);

    const newCart = this.cartRepository.create({ customerId: savedUser.id });
    await this.cartRepository.save(newCart);

    const { passwordHash: _, ...result } = savedUser;
    return result;
  }

  /**
   * Genera el SHA-256 hash de un token para almacenamiento seguro en BD.
   */
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verifica el estado de la cuenta (activa / bloqueada por lockout).
   */
  checkAccountStatus(user: User): void {
    if (user.isBlocked || (user.lockedUntil !== null && user.lockedUntil !== undefined && new Date() < user.lockedUntil)) {
      throw new HttpException(
        'La cuenta se encuentra bloqueada por múltiples intentos fallidos',
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
   * Incrementa el contador de intentos fallidos. Al alcanzar 3 fallos, setea locked_until = now() y bloquea la cuenta.
   */
  async handleFailedLogin(user: User): Promise<void> {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    user.failedLoginAttempts = attempts;

    if (attempts >= 3) {
      user.lockedUntil = new Date();
      user.isBlocked = true;
      await this.userRepository.save(user);
      throw new HttpException(
        'La cuenta se encuentra bloqueada por múltiples intentos fallidos',
        HttpStatus.LOCKED,
      );
    }

    await this.userRepository.save(user);
  }

  /**
   * Reinicia el contador failed_login_attempts a 0 y desmarca el bloqueo tras un login exitoso.
   */
  async handleSuccessfulLogin(user: User): Promise<void> {
    if (
      user.failedLoginAttempts > 0 ||
      user.lockedUntil !== null ||
      user.isBlocked
    ) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      user.isBlocked = false;
      await this.userRepository.save(user);
    }
  }

  /**
   * Emite un Access Token (JWT) con vigencia de 15 minutos.
   */
  async issueAccessToken(user: User): Promise<string> {
    this.checkAccountStatus(user);

    const rol = user.roles && user.roles.length > 0 ? user.roles[0].name : 'cliente';

    const payload = {
      sub: user.id,
      email: user.email,
      rol,
      tokenVersion: user.tokenVersion,
    };

    const secret = this.configService.get<string>('JWT_SECRET') || 'default_secret';
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');

    return this.jwtService.signAsync(payload, { secret, expiresIn: expiresIn as any });
  }

  /**
   * Emite un Refresh Token (JWT) con vigencia de 7 días, calcula su hash SHA-256 y lo guarda en BD.
   */
  async issueRefreshToken(userId: string): Promise<string> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'default_secret';
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const rawRefreshToken = await this.jwtService.signAsync(
      { sub: userId, type: 'refresh' },
      { secret: refreshSecret, expiresIn: refreshExpiresIn as any },
    );

    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

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
   * Revoca todos los refresh tokens activos de un usuario.
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );
  }

  /**
   * Revoca un refresh token específico por su valor raw.
   */
  async revokeToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.refreshTokenRepository.update(
      { tokenHash, revoked: false },
      { revoked: true },
    );
  }

  /**
   * Valida un Refresh Token y realiza su rotación:
   * 1. Verifica la firma JWT del token de refresco.
   * 2. Busca el registro por tokenHash en BD.
   * 3. Si el token YA FUE REVOCADO -> Detección de Reutilización Maliciosa -> Invalida TODAS las sesiones del usuario.
   * 4. Emite un nuevo Refresh Token y un nuevo Access Token.
   * 5. Marca el previo como revocado y asigna replacedByTokenHash.
   */
  async validateAndRotate(
    rawToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'default_secret';

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

    // Detección de Reutilización Maliciosa
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

    const user = await this.userRepository.findOne({
      where: { id: tokenRecord.userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    this.checkAccountStatus(user);

    const newRefreshToken = await this.issueRefreshToken(user.id);
    const newTokenHash = this.hashToken(newRefreshToken);

    tokenRecord.revoked = true;
    tokenRecord.replacedByTokenHash = newTokenHash;
    await this.refreshTokenRepository.save(tokenRecord);

    const newAccessToken = await this.issueAccessToken(user);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  /**
   * Cambia la contraseña del usuario autenticado:
   * 1. Valida currentPassword con bcrypt.compare (HTTP 400 si no coincide)
   * 2. Valida complejidad de newPassword (HTTP 422 si no cumple)
   * 3. Hashea la nueva contraseña con bcrypt (salt rounds = 10)
   * 4. Asigna user.passwordHash = newHash y user.mustChangePassword = false
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    if (!PASSWORD_COMPLEXITY_REGEX.test(newPassword)) {
      throw new UnprocessableEntityException(
        'La nueva contraseña no cumple con la política de complejidad (mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial)',
      );
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    user.passwordHash = newHashedPassword;
    user.mustChangePassword = false;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.isBlocked = false;

    await this.userRepository.save(user);
  }

  private checkForgotPasswordRateLimit(identifier: string): void {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const maxRequests = 3;

    const record = this.forgotPasswordRateLimitMap.get(identifier);
    if (!record || now > record.resetAt) {
      this.forgotPasswordRateLimitMap.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return;
    }

    if (record.count >= maxRequests) {
      throw new HttpException(
        'Demasiadas solicitudes de recuperación de contraseña para este correo o IP. Por favor intente más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count += 1;
  }

  /**
   * Solicitud de recuperación de contraseña (Forgot Password):
   * Rate limiting por IP/email, generación de token SHA-256 (30 min) y respuesta genérica HTTP 200.
   */
  async forgotPassword(
    email: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    if (ipAddress) {
      this.checkForgotPasswordRateLimit(`ip:${ipAddress}`);
    }
    if (normalizedEmail) {
      this.checkForgotPasswordRateLimit(`email:${normalizedEmail}`);
    }

    const user = await this.userRepository.findOneBy({
      email: normalizedEmail,
    });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const resetTokenRecord = this.passwordResetTokenRepository.create({
        userId: user.id,
        tokenHash,
        used: false,
        expiresAt,
      });
      await this.passwordResetTokenRepository.save(resetTokenRecord);

      this.logger.log(
        `[MOCK EMAIL SERVICE] Enlace de recuperación para ${user.email}: http://localhost:3000/auth/reset-password?token=${rawToken} | Expira: ${expiresAt.toISOString()}`,
      );
    }

    return {
      message:
        'Si el correo electrónico existe en nuestro sistema, se ha enviado un enlace para restablecer la contraseña.',
    };
  }

  /**
   * Restablecimiento de contraseña con token de un solo uso.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = this.hashToken(token);
    const tokenRecord = await this.passwordResetTokenRepository.findOneBy({
      tokenHash,
    });

    if (
      !tokenRecord ||
      tokenRecord.used ||
      new Date() > tokenRecord.expiresAt
    ) {
      throw new BadRequestException(
        'Token de recuperación inválido, revocado o expirado',
      );
    }

    const user = await this.userRepository.findOneBy({
      id: tokenRecord.userId,
    });
    if (!user) {
      throw new BadRequestException(
        'Usuario asociado al token no encontrado',
      );
    }

    if (!PASSWORD_COMPLEXITY_REGEX.test(newPassword)) {
      throw new UnprocessableEntityException(
        'La nueva contraseña no cumple con la política de complejidad (mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial)',
      );
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newHashedPassword;
    user.mustChangePassword = false;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.isBlocked = false;
    await this.userRepository.save(user);

    tokenRecord.used = true;
    await this.passwordResetTokenRepository.save(tokenRecord);

    await this.revokeAllUserTokens(user.id);

    return { message: 'Contraseña restablecida exitosamente' };
  }
}
