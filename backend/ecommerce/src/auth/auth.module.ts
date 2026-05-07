import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; 
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { AuthController } from './auth.controller';
import { HashService } from './hash.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    
   
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        
        secret: config.get<string>('JWT_SECRET') || 'back4455end', 
        signOptions: { expiresIn: '1d' }, 
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [HashService],
  exports: [HashService, JwtModule], 
})
export class AuthModule {}