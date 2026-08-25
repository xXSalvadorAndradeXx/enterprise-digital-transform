// src/module/customers/strategies/customer-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret',
    });
  }

  async validate(payload: any) {
    // Validar tipo de token
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Tipo de token inválido.');
    }

    const customer = await this.customerRepository.findOne({
      where: { id: payload.sub },
    });

    if (!customer) {
      throw new UnauthorizedException('Acceso no autorizado. Cliente no encontrado.');
    }

    if (!customer.isActive) {
      throw new UnauthorizedException('Acceso no autorizado. La cuenta se encuentra inactiva.');
    }

    return {
      id: customer.id,
      customerId: customer.id,
      email: customer.email,
      fullName: customer.fullName,
      type: 'CUSTOMER',
    };
  }
}
