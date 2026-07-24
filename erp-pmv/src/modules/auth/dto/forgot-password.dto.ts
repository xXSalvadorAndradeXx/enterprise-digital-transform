// src/modules/auth/dto/forgot-password.dto.ts
import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@erp.local' })
  @IsEmail()
  email: string;
}