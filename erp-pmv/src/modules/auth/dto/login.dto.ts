// src/modules/auth/dto/login.dto.ts
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'superadmin@erp.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin1234!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}