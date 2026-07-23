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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    await this.authService.revokeAllUserTokens(userId);
    return { message: 'Sesión cerrada exitosamente en todos los dispositivos' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return req.user;
  }
}