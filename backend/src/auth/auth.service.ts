import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Cart } from '../cart/entities/cart.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Verificar que el email no esté en uso
    const exists = await this.userRepo.findOne({ where: { email: dto.email }});
    if (exists) throw new ConflictException('El email ya está registrado');

    
    // 2. Crear usuario (el @BeforeInsert hashea el password)
    const user = this.userRepo.create(dto);
    await this.userRepo.save(user);

    // 3. Cacío para erear carrito vl usuario
    const cart = this.cartRepo.create({ user });
    await this.cartRepo.save(cart);

    // 4. Generar y devolver token
    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    // addSelect incluye el campo password (que tiene select:false)
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    // bcrypt.compare compara el password plano contra el hash
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    // Payload: datos que se guardan en el JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}