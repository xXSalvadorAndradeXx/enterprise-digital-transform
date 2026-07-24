// src/modules/users/dto/create-user.dto.ts
import {
  IsString, IsEmail, MinLength,
  MaxLength, IsArray, IsUUID,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'juan@empresa.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}