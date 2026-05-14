import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; 
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { AuthController } from './auth.controller';
import { HashService } from './hash.service';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './jwt.strategy'; // 1. Importación de la estrategia

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'), 
        signOptions: { expiresIn: '1d' }, 
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [HashService, JwtStrategy], // 2. Registro de la estrategia como proveedor
  exports: [HashService, JwtModule, JwtStrategy], // 3. Exportación para otros módulos
})
export class AuthModule {}