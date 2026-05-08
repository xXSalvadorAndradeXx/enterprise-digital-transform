import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    private jwtService: JwtService,
  ) {}

  // ─────────────────────────────────────────
  // REGISTRO
  // ─────────────────────────────────────────
  async register(dto: RegisterDto) {
    // 1. Verificar email único
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');

    // 2. Crear usuario + carrito en una transacción
    //    Si falla cualquier paso, se deshace todo (sin usuarios huérfanos)
    const queryRunner =
      this.userRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // create() instancia el objeto pero NO lo guarda todavía
      // save() dispara @BeforeInsert → hashea el password → INSERT
      const user = queryRunner.manager.create(User, dto);
      await queryRunner.manager.save(user);

      const cart = queryRunner.manager.create(Cart, { user });
      await queryRunner.manager.save(cart);

      // Si todo salió bien, confirmar los cambios en BD
      await queryRunner.commitTransaction();

      return this.generateToken(user);
    } catch (error) {
      // Si algo falló, revertir TODO (ni usuario ni carrito quedan guardados)
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Siempre liberar la conexión, haya error o no
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────
  async login(dto: LoginDto) {
    // 1. Buscar usuario incluyendo el password
    //    (findOne normal no lo trae porque tiene select:false en la entidad)
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password') // fuerza incluir el campo oculto
      .where('user.email = :email', { email: dto.email })
      .getOne();

    // 2. Mismo error si no existe el email O si el password es incorrecto
    //    (nunca reveles cuál de los dos falló → seguridad)
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    // 3. Comparar password en texto plano contra el hash guardado en BD
    //    bcrypt.compare() hace el hash internamente y compara
    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Credenciales inválidas');

    // 4. Verificar que la cuenta esté activa
    if (!user.isActive) throw new UnauthorizedException('Cuenta desactivada');

    return this.generateToken(user);
  }

  // ─────────────────────────────────────────
  // GENERAR JWT
  // ─────────────────────────────────────────
  private generateToken(user: User) {
    // El payload se guarda DENTRO del token (no encriptado, solo firmado)
    // NUNCA incluyas el password aquí
    const payload = {
      sub: user.id,       // "sub" es el estándar JWT para el ID del sujeto
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}