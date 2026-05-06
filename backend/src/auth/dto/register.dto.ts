import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {

  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Mínimo 8 caracteres' })
  @MaxLength(50)
  password!: string;
}

