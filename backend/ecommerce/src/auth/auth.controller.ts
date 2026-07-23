import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  ConflictException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { HashService } from './hash.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { MustChangePasswordGuard } from './guards/must-change-password.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly hashService: HashService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOneBy({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await this.hashService.hashPassword(
      registerDto.password,
    );

    const newUser = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);

    const newCart = this.cartRepository.create({ user: savedUser });
    await this.cartRepository.save(newCart);

    const { password: _, ...result } = savedUser;
    return result;
  }

  @ApiOperation({
    summary: 'Iniciar sesión de usuario con credenciales (LocalStrategy)',
    description:
      'Valida credenciales utilizando LocalStrategy. Retorna 200 con tokens y el flag mustChangePassword. Retorna 401 si las credenciales son inválidas y 423 si la cuenta está bloqueada.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'd3b07384-d113-4603-9d4f-40291410d5e6' },
            nombre: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', example: 'juan@example.com' },
            rol: { type: 'string', example: 'cliente' },
            mustChangePassword: { type: 'boolean', example: false },
          },
        },
        mustChangePassword: { type: 'boolean', example: false },
        must_change_password: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta inactiva',
    schema: {
      type: 'object',
      example: {
        statusCode: 401,
        message: 'Credenciales inválidas',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 423,
    description: 'Cuenta bloqueada (Lockout)',
    schema: {
      type: 'object',
      example: {
        statusCode: 423,
        message: 'La cuenta se encuentra bloqueada',
        error: 'Locked',
      },
    },
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: any, @Body() _loginDto: LoginDto) {
    const user: User = req.user;

    const accessToken = await this.authService.issueAccessToken(user);
    const refreshToken = await this.authService.issueRefreshToken(user.id);
    const mustChangePassword = !!user.mustChangePassword;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        mustChangePassword,
      },
      mustChangePassword,
      must_change_password: mustChangePassword,
    };
  }

  @ApiOperation({
    summary: 'Renovar Access Token y Refresh Token (Rotación Segura)',
    description:
      'Valida el Refresh Token provisto y efectúa la rotación emitiendo un nuevo par Access Token (15 min) y Refresh Token (7 días). Si se detecta la reutilización de un token revocado previamente, invalida todas las sesiones activas del usuario por seguridad (HTTP 401).',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Rotación exitosa de tokens',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
        refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description:
      'Refresh Token inválido, expirado, no encontrado o reutilización detectada',
    schema: {
      type: 'object',
      example: {
        statusCode: 401,
        message:
          'Se ha detectado la reutilización de un token revocado. Todas las sesiones activas han sido invalidadas por seguridad.',
        error: 'Unauthorized',
      },
    },
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.authService.validateAndRotate(
      refreshTokenDto.refreshToken,
    );

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  @ApiOperation({
    summary: 'Cerrar sesión de usuario (Logout)',
    description:
      'Revoca el Refresh Token activo provisto (o todas las sesiones del usuario) marcando revoked=true en la base de datos. Requiere estar autenticado con Bearer Token JWT.',
  })
  @ApiBearerAuth()
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiResponse({
    status: 204,
    description: 'Cierre de sesión exitoso (Sin contenido)',
  })
  @ApiResponse({
    status: 401,
    description: 'Acceso no autorizado - Bearer Token JWT ausente o inválido',
    schema: {
      type: 'object',
      example: {
        statusCode: 401,
        message: 'Acceso no autorizado. Token inválido o inexistente.',
        error: 'Unauthorized',
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: any, @Body() refreshTokenDto?: RefreshTokenDto) {
    const userId = req.user.userId || req.user.id;

    if (refreshTokenDto && refreshTokenDto.refreshToken) {
      await this.authService.revokeToken(refreshTokenDto.refreshToken);
    } else {
      await this.authService.revokeAllUserTokens(userId);
    }
  }

  @ApiOperation({
    summary: 'Cambiar contraseña de usuario autenticado',
    description:
      'Valida la contraseña actual (HTTP 400), valida la complejidad de la nueva contraseña (HTTP 422), la encripta con bcrypt (salt=10) y limpia el flag must_change_password (HTTP 200).',
  })
  @ApiBearerAuth()
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada exitosamente',
    schema: {
      type: 'object',
      example: { message: 'Contraseña actualizada exitosamente' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'La contraseña actual es incorrecta',
    schema: {
      type: 'object',
      example: {
        statusCode: 400,
        message: 'La contraseña actual es incorrecta',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Debe cambiar su contraseña antes de realizar otra acción',
    schema: {
      type: 'object',
      example: {
        statusCode: 403,
        message:
          'Debe cambiar su contraseña antes de realizar cualquier otra operación en la plataforma',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'La nueva contraseña no cumple con la política de complejidad',
    schema: {
      type: 'object',
      example: {
        statusCode: 422,
        message:
          'La nueva contraseña no cumple con la política de complejidad (mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial)',
        error: 'Unprocessable Entity',
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.userId || req.user.id;
    await this.authService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Contraseña actualizada exitosamente' };
  }

  @ApiOperation({
    summary: 'Solicitar enlace de recuperación de contraseña (Forgot Password)',
    description:
      'Genera un token de un solo uso con vigencia de 30 minutos guardado como hash SHA-256. Responde SIEMPRE con HTTP 200 y mensaje genérico para evitar filtración de existencia de cuentas. Aplica Rate Limiting (HTTP 429).',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Mensaje genérico de confirmación',
    schema: {
      type: 'object',
      example: {
        message:
          'Si el correo electrónico existe en nuestro sistema, se ha enviado un enlace para restablecer la contraseña.',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas solicitudes para el correo o IP (Rate Limiting)',
    schema: {
      type: 'object',
      example: {
        statusCode: 429,
        message:
          'Demasiadas solicitudes de recuperación de contraseña para este correo o IP. Por favor intente más tarde.',
        error: 'Too Many Requests',
      },
    },
  })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Req() req: any,
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    return this.authService.forgotPassword(forgotPasswordDto.email, ipAddress);
  }

  @ApiOperation({
    summary: 'Restablecer contraseña con token de un solo uso (Reset Password)',
    description:
      'Valida el token contra password_reset_tokens (no usado, no expirado, hash SHA-256 coincidente). Encripta la nueva clave con bcrypt (salt=10), marca el token como used=true y revoca todos los refresh tokens activos del usuario.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
    schema: {
      type: 'object',
      example: { message: 'Contraseña restablecida exitosamente' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token de recuperación inválido, revocado o expirado',
    schema: {
      type: 'object',
      example: {
        statusCode: 400,
        message: 'Token de recuperación inválido, revocado o expirado',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'La nueva contraseña no cumple con la política de complejidad',
    schema: {
      type: 'object',
      example: {
        statusCode: 422,
        message:
          'La nueva contraseña no cumple con la política de complejidad (mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial)',
        error: 'Unprocessable Entity',
      },
    },
  })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, MustChangePasswordGuard)
  getProfile(@Req() req: any) {
    return req.user;
  }
}