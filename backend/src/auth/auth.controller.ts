import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')  // → /api/auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')  // → POST /api/auth/register
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)  // Por defecto POST = 201, queremos 200
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}