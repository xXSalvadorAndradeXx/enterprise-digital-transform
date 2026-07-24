// src/modules/auth/auth.controller.ts
import {
  Controller, Post, Get, Body, Req,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión — devuelve access + refresh token' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ip:        req.ip,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Renovar access token con refresh token' })
  refresh(
    @Body() dto: RefreshTokenDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.authService.refresh(dto, user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cerrar sesión — revoca todos los refresh tokens' })
  logout(@CurrentUser() user: { id: string }) {
    return this.authService.logout(user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cambiar contraseña' })
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.authService.changePassword(user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña por email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Restablecer contraseña con token del email' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}