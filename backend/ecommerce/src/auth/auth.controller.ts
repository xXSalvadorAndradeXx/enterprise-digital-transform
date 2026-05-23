import { Controller, Post, Body, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt'; 
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { HashService } from './hash.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService, 
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOneBy({ email: registerDto.email });
    
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await this.hashService.hashPassword(registerDto.password);

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

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordMatching = await this.hashService.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    
    const payload = { 
      sub: user.id,  
      email: user.email,
      rol: user.rol 
    };

    // Emision el JWT firmado de forma asíncrona
    const token = await this.jwtService.signAsync(payload);

    
    return { 
      message: 'Login exitoso', 
      access_token: token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    };
  }
}