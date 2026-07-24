import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
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
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Registrar nuevo usuario en la plataforma',
    description:
      'Crea una nueva cuenta de usuario con rol cliente por defecto y asigna un carrito de compras automáticamente.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    schema: {
      type: 'object',
      example: {
        id: 'd3b07384-d113-4603-9d4f-40291410d5e6',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        isActive: true,
        mustChangePassword: false,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de registro inválidos (fallo de validación DTO)',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo electrónico ya está registrado',
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
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
  })
  @ApiResponse({
    status: 423,
    description: 'Cuenta bloqueada (Lockout)',
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: any, @Body() _loginDto: LoginDto) {
    const user = req.user;
    const accessToken = await this.authService.issueAccessToken(user);
    const refreshToken = await this.authService.issueRefreshToken(user.id);
    await this.authService.handleSuccessfulLogin(user);

    const rol = user.roles && user.roles.length > 0 ? user.roles[0].name : (user.rol || 'cliente');
    const nombre = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.nombre || user.email;

    return {
      accessToken,
      refreshToken,
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        nombre,
        email: user.email,
        rol,
        mustChangePassword: user.mustChangePassword,
      },
      mustChangePassword: user.mustChangePassword,
      must_change_password: user.mustChangePassword,
    };
  }

  @ApiOperation({
    summary: 'Rotar Refresh Token e inferir nuevo Access Token',
    description:
      'Valida la firma del Refresh Token, verifica su presencia y estado en la base de datos (revocado=false, no expirado). Si el token YA fue revocado previamente, detecta reutilización maliciosa e invalida todas las sesiones activas del usuario.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Nuevos tokens generados exitosamente',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token revocado, expirado o malicioso',
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
    };
  }

  @ApiOperation({
    summary: 'Cerrar sesión de usuario (Logout)',
    description:
      'Invalida el Refresh Token enviado en el body, o si no se envía DTO, revoca la totalidad de las sesiones activas del usuario autenticado.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 204,
    description: 'Sesión cerrada exitosamente (sin contenido)',
  })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: any, @Body() refreshTokenDto?: RefreshTokenDto) {
    const userId = req.user.userId || req.user.id || req.user.sub;

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
  })
  @ApiResponse({
    status: 400,
    description: 'La contraseña actual es incorrecta',
  })
  @ApiResponse({
    status: 422,
    description: 'La nueva contraseña no cumple con la política de complejidad',
  })
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.userId || req.user.id || req.user.sub;
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
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas solicitudes para el correo o IP (Rate Limiting)',
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
      'Valida el token contra password_reset_tokens. Encripta la nueva clave con bcrypt (salt=10), marca el token como used=true y revoca todos los refresh tokens activos del usuario.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Token de recuperación inválido, revocado o expirado',
  })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado (Me)',
    description:
      'Retorna los datos del usuario autenticado a partir del Bearer Token JWT, incluyendo su información de perfil, roles y permisos asignados.',
  })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario autenticado',
  })
  @Get('me')
  @UseGuards(JwtAuthGuard, MustChangePasswordGuard)
  getProfile(@Req() req: any) {
    const { roles, permissions, ...user } = req.user;
    return { user, roles, permissions };
  }
}