import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_COMPLEXITY_REGEX } from './change-password.dto';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f67890...',
    description: 'Token de un solo uso recibido para restablecer contraseña',
  })
  @IsString()
  @IsNotEmpty({ message: 'El token de recuperación es requerido' })
  token!: string;

  @ApiProperty({
    example: 'NewSecretPass123!',
    description:
      'Nueva contraseña (mínimo 8 caracteres, incluye mayúscula, minúscula, número y carácter especial)',
  })
  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message:
      'La nueva contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial (@$!%*?&#._-+=)',
  })
  newPassword!: string;
}
