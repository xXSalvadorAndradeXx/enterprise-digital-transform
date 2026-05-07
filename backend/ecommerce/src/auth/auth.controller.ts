import { Controller, Post, Body, UnauthorizedException, ConflictException } from '@nestjs/common';import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { HashService } from './hash.service';
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashService: HashService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // 1. Verificar si el email ya existe
    const existingUser = await this.userRepository.findOneBy({ email });
    
    if (existingUser) {
      // Lanzamos un error 409 (Conflict) si el correo ya está en uso
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // 2. Si no existe, procedemos con el hash y el guardado
    const hashedPassword = await this.hashService.hashPassword(password);

    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);
    const { password: _, ...result } = savedUser;
    return result;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Buscar al usuario por email
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Comparar la contraseña enviada con el hash de la DB usando el HashService
    const isPasswordMatching = await this.hashService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Si todo está bien, por ahora retornamos éxito
    return { message: 'Login exitoso', userId: user.id };
  }

}