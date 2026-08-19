import { IsJWT, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class RefreshTokenDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: 'El token de refresco debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token de refresco es requerido' })
  @IsJWT({ message: 'El token de refresco debe ser un JWT válido' })
  refreshToken!: string;
}
