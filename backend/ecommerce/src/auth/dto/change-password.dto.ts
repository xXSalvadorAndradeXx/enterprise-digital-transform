import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#._\-\+\=])[A-Za-z\d@$!%*?&#._\-\+\=]{8,}$/;

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: 'Contraseña actual del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  currentPassword!: string;

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
