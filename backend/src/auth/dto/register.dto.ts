import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MaxLength(50, { message: 'Máximo 50 caracteres' })
  name!: string;

  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'Mínimo 8 caracteres' })
  @MaxLength(50, { message: 'Máximo 50 caracteres' })
  password!: string;

  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsEnum(UserRole, {
    message: 'El rol debe ser "admin" o "user"',
  })
  role!: UserRole;
}

