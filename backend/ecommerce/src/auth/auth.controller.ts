import { Controller, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { HashService } from './hash.service';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashService: HashService,
  ) {}

  @Post('register')
  async register(@Body() body: any) {
    const { email, password } = body;

    const hashedPassword = await this.hashService.hashPassword(password);

    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Retornamos todo excepto el password
    const { password: _, ...result } = savedUser;
    return result;
  }
}