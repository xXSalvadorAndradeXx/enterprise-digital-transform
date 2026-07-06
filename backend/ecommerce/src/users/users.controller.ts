import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard) 
  @Get('profile')
  getProfile(@Request() req) {
    return {
      message: '¡Acceso exitoso a la ruta protegida!',
      user: req.user,
    };
  }
}