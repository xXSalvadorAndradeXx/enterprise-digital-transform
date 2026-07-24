// src/modules/auth/dto/reset-password.dto.ts
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recibido por email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}